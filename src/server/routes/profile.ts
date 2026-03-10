import { Router } from "express";
import { verifyToken, AuthRequest } from "../middleware/auth";
import { getItem, updateItem, getAllItems, createItem } from "../utils/db-helpers";
import { TABLES } from "../db";
import { Response } from "express";

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

// GET user profile by ID
router.get("/:userId", async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
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

        const updates = req.body;

        const user = await getItem<UserProfileData>(TABLES.USERS, { id: req.user.id });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser: UserProfileData = {
            ...user,
            ...updates,
            id: user.id, // Ensure ID is not changed
            email: user.email, // Ensure email is not changed
            role: user.role, // Ensure role is not changed
        };

        await createItem<UserProfileData>(TABLES.USERS, updatedUser);

        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser as any;
        res.json(userWithoutPassword);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
