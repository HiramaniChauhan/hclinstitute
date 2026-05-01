import { Router } from "express";
import { verifyToken, AuthRequest } from "../middleware/auth";
import { getItem, updateItem, getAllItems, createItem, deleteItem } from "../utils/db-helpers";
import { TABLES } from "../db";
import { Response } from "express";
import { docClient } from "../db-wrapper";
import { GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const router = Router();

interface UserProfileData {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    department?: string;
    semester?: number;
    aadharNumber?: string;
    profileImage?: string;
    bio?: string;
    isVerified?: boolean;
    fatherName?: string;
    motherName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    qualification?: string;
    institute?: string;
    createdAt: string;
}

// GET current user profile
router.get("/me", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await getItem<UserProfileData>(TABLES.USERS, { id: req.user.id });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user as any;
        res.json(userWithoutPassword);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET user profile by ID (own profile or admin only)
router.get("/:userId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { userId } = req.params;

        // Only allow users to view their own profile, or admins to view anyone
        if (req.user.id !== userId && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        const user = await getItem<UserProfileData>(TABLES.USERS, { id: userId });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user as any;
        res.json(userWithoutPassword);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET all users (Admin only)
router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const users = await getAllItems<UserProfileData>(TABLES.USERS);

        // Remove passwords from response
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user as any;
            return userWithoutPassword;
        });

        res.json(usersWithoutPasswords);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update user profile
router.put("/me", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Strip sensitive/privileged fields — only allow safe profile updates
        const { password, role, id, email, isDeleted, deletedAt, sessionId,
                provider, isVerified, verifiedAt, verifiedBy,
                isSuspended, suspendedAt, suspendedBy, suspensionReason,
                createdAt, ...safeUpdates } = req.body;

        const user = await getItem<UserProfileData>(TABLES.USERS, { id: req.user.id });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser: UserProfileData = {
            ...user,
            ...safeUpdates,
        };

        await createItem(TABLES.USERS, updatedUser);

        // Remove password from response
        const { password: _pw, ...userWithoutPassword } = updatedUser as any;
        res.json(userWithoutPassword);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update any user profile (Admin only)
router.put("/:userId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { userId } = req.params;

        // Strip sensitive fields — admins can update most things but not these
        const { password, id, email, role, isDeleted, deletedAt, sessionId,
                provider, createdAt, ...safeUpdates } = req.body;

        const user = await getItem<UserProfileData>(TABLES.USERS, { id: userId });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser: UserProfileData = {
            ...user,
            ...safeUpdates,
        };

        await createItem(TABLES.USERS, updatedUser);

        // Remove password from response
        const { password: _pw2, ...userWithoutPassword } = updatedUser as any;
        res.json(userWithoutPassword);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST delete account via OTP
router.post("/delete-account", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ error: "OTP is required" });
        }

        // Verify OTP
        const otpResult = await docClient.send(new GetCommand({
            TableName: TABLES.OTPS,
            Key: { email: req.user.email },
        }));

        const storedOtp = otpResult.Item;
        if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // OTP is valid. Proceed to soft delete.
        const user = await getItem<UserProfileData>(TABLES.USERS, { id: req.user.id });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = {
            ...user,
            isDeleted: true,
            deletedAt: new Date().toISOString()
        };

        await createItem(TABLES.USERS, updatedUser);

        // Remove all course/batch enrollments
        const allEnrollments = await getAllItems<any>(TABLES.ENROLLMENTS);
        const userEnrollments = allEnrollments.filter((e: any) => e.userId === user.id);
        await Promise.all(userEnrollments.map((e: any) => deleteItem(TABLES.ENROLLMENTS, { enrollmentId: e.enrollmentId })));

        // Clean up OTP
        await docClient.send(new DeleteCommand({
            TableName: TABLES.OTPS,
            Key: { email: req.user.email },
        }));

        res.json({ message: "Account deleted successfully." });
    } catch (error: any) {
        console.error("[Profile Delete] Error:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
});

export default router;
