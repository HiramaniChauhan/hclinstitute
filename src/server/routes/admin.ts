import { Router } from "express";
import { maskEmail } from "../utils/maskEmail";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { getAllItems, getItem, createItem, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";
import { parseDuration } from "./payments";

const router = Router();

// ─── Admin Dashboard Stats ───────────────────────────────────────────────────
router.get("/dashboard", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const [users, courses, tests, results, enrollments] = await Promise.all([
            getAllItems<any>(TABLES.USERS),
            getAllItems<any>(TABLES.COURSES),
            getAllItems<any>(TABLES.TESTS),
            getAllItems<any>(TABLES.RESULTS),
            getAllItems<any>(TABLES.ENROLLMENTS),
        ]);

        const students = users.filter((u: any) => u.role === "student");
        const admins = users.filter((u: any) => u.role === "admin");
        const verifiedStudents = students.filter((u: any) => u.isVerified);
        const suspendedStudents = students.filter((u: any) => u.isSuspended);
        const passedResults = results.filter((r: any) => r.status === "passed");
        const passRate = results.length > 0 ? Math.round((passedResults.length / results.length) * 100) : 0;
        const avgScore = results.length > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0) / results.length)
            : 0;

        res.json({
            totalStudents: students.length,
            verifiedStudents: verifiedStudents.length,
            suspendedStudents: suspendedStudents.length,
            totalAdmins: admins.length,
            totalCourses: courses.length,
            totalTests: tests.length,
            totalResults: results.length,
            passRate,
            avgScore,
            totalEnrollments: enrollments.length,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Student Management ───────────────────────────────────────────────────────

// GET all students
router.get("/students", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const users = await getAllItems<any>(TABLES.USERS);
        const students = users
            .filter((u: any) => u.role === "student")
            .map(({ password, ...rest }: any) => rest)
            .sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA; // Newest first
            });
        res.json(students);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET single student by ID
router.get("/students/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const { password, ...rest } = user;
        res.json(rest);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT verify a student
router.put("/students/:id/verify", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const updated = { ...user, isVerified: true, verifiedAt: new Date().toISOString(), verifiedBy: req.user?.id };
        await createItem(TABLES.USERS, updated);

        // Create notification for student
        await createItem(TABLES.NOTIFICATIONS, {
            notificationId: generateId("notif"),
            userId: user.id,
            title: "Account Verified",
            message: "Your student account has been verified by the admin. You now have full access.",
            type: "verification",
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        const { password, ...rest } = updated;
        res.json({ message: "Student verified successfully", student: rest });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT unverify a student
router.put("/students/:id/unverify", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const updated = { ...user, isVerified: false };
        delete updated.verifiedAt;
        delete updated.verifiedBy;
        await createItem(TABLES.USERS, updated);

        // Create notification for student
        await createItem(TABLES.NOTIFICATIONS, {
            notificationId: generateId("notif"),
            userId: user.id,
            title: "Verification Revoked",
            message: "Your account verification has been removed by the admin. Please correct any missing documents.",
            type: "verification",
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        const { password, ...rest } = updated;
        res.json({ message: "Student unverified successfully", student: rest });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT suspend a student
router.put("/students/:id/suspend", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const { reason } = req.body;
        const updated = {
            ...user,
            isSuspended: true,
            suspendedAt: new Date().toISOString(),
            suspendedBy: req.user?.id,
            suspensionReason: reason || "Suspended by admin",
        };
        await createItem(TABLES.USERS, updated);

        // Create notification for student
        await createItem(TABLES.NOTIFICATIONS, {
            notificationId: generateId("notif"),
            userId: user.id,
            title: "Account Suspended",
            message: reason || "Your account has been suspended. Please contact admin for details.",
            type: "suspension",
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        const { password, ...rest } = updated;
        res.json({ message: "Student suspended successfully", student: rest });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT unsuspend a student
router.put("/students/:id/unsuspend", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const updated = { ...user, isSuspended: false, unsuspendedAt: new Date().toISOString() };
        await createItem(TABLES.USERS, updated);

        await createItem(TABLES.NOTIFICATIONS, {
            notificationId: generateId("notif"),
            userId: user.id,
            title: "Account Reinstated",
            message: "Your account suspension has been lifted. Welcome back!",
            type: "verification",
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        const { password, ...rest } = updated;
        res.json({ message: "Student unsuspended successfully", student: rest });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT assign student to batch
router.put("/students/:id/batch", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const { batchId, batchName, courseId } = req.body;
        if (!batchId) return res.status(400).json({ error: "batchId is required" });

        const updated = { ...user, batchId, batchName };
        if (courseId) (updated as any).courseId = courseId;

        await createItem(TABLES.USERS, updated);

        const enrolledAt = new Date().toISOString();
        const course = courseId ? await getItem<any>(TABLES.COURSES, { id: courseId }) : null;

        // Also create enrollment record
        await createItem(TABLES.ENROLLMENTS, {
            enrollmentId: generateId("enrollment"),
            userId: user.id,
            courseId: courseId || null,
            batchId,
            enrolledAt,
            enrolledBy: req.user?.id,
            status: "active",
            expiresAt: course ? parseDuration(course.duration, new Date(enrolledAt)) : null,
        });

        // Create a $0 fee record for tracking
        await createItem(TABLES.FEES, {
            feeId: generateId("fee"),
            userId: user.id,
            courseId: courseId || null,
            description: `Batch Assignment: ${batchName || batchId}${course ? ` (${course.title})` : ''}`,
            amount: 0,
            status: "paid",
            category: "tuition",
            createdAt: enrolledAt,
            createdBy: req.user?.id || "system",
            dueDate: enrolledAt,
            paidAt: enrolledAt,
        });

        // Notify student
        await createItem(TABLES.NOTIFICATIONS, {
            notificationId: generateId("notif"),
            userId: user.id,
            title: "Batch Assigned",
            message: `You have been assigned to batch: ${batchName || batchId}.`,
            type: "batch",
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        const { password, ...rest } = updated;
        res.json({ message: "Student assigned to batch successfully", student: rest });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE soft remove a student
router.delete("/students/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const updated = { ...user, isDeleted: true, deletedAt: new Date().toISOString() };
        await createItem(TABLES.USERS, updated);

        // Remove all course/batch enrollments for this student
        const allEnrollments = await getAllItems<any>(TABLES.ENROLLMENTS);
        const userEnrollments = allEnrollments.filter((e: any) => e.userId === user.id);
        await Promise.all(userEnrollments.map((e: any) => deleteItem(TABLES.ENROLLMENTS, { enrollmentId: e.enrollmentId })));

        res.json({ message: "Student moved to deleted accounts successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE permanently remove a student
router.delete("/students/:id/permanent", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        await deleteItem(TABLES.USERS, { id: req.params.id });
        res.json({ message: "Student permanently deleted" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT restore a deleted student
router.put("/students/:id/restore", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const user = await getItem<any>(TABLES.USERS, { id: req.params.id });
        if (!user || user.role !== "student") {
            return res.status(404).json({ error: "Student not found" });
        }
        const updated = { ...user, isDeleted: false };
        delete updated.deletedAt;
        await createItem(TABLES.USERS, updated);
        res.json({ message: "Student restored successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Broadcast Notification (to all students) ────────────────────────────────
router.post("/notify", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { title, message, type } = req.body;
        if (!title || !message) return res.status(400).json({ error: "title and message are required" });

        const users = await getAllItems<any>(TABLES.USERS);
        const students = users.filter((u: any) => u.role === "student");

        const notifications = students.map((s: any) => ({
            notificationId: generateId("notif"),
            userId: s.id,
            title,
            message,
            type: type || "announcement",
            isRead: false,
            createdAt: new Date().toISOString(),
        }));

        await Promise.all(notifications.map((n: any) => createItem(TABLES.NOTIFICATIONS, n)));
        res.json({ message: `Notification sent to ${students.length} students` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ─── Admin Management ─────────────────────────────────────────────────────────

const SUPER_ADMIN_EMAIL = process.env.VITE_SUPER_ADMIN_EMAIL!;

// GET all admins
router.get("/admins", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const users = await getAllItems<any>(TABLES.USERS);
        const admins = users
            .filter((u: any) => u.role === "admin" && !u.isDeleted)
            .map(({ password, ...rest }: any) => rest)
            .sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA; // Newest first
            });
        res.json(admins);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST send OTP for admin deletion (always sent to super admin email)
router.post("/admins/delete-otp", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { adminId } = req.body;
        if (!adminId) return res.status(400).json({ error: "adminId is required" });

        // Can't delete yourself
        if (req.user?.id === adminId) {
            return res.status(403).json({ error: "You cannot delete your own admin account" });
        }

        // Verify target admin exists
        const targetAdmin = await getItem<any>(TABLES.USERS, { id: adminId });
        if (!targetAdmin || targetAdmin.role !== "admin") {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Generate OTP and store under the super admin email key
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP using a unique key combining the super admin email and admin deletion purpose
        const { docClient, TABLES: T } = await import("../db-wrapper");
        const { PutCommand } = await import("@aws-sdk/lib-dynamodb");
        await docClient.send(new PutCommand({
            TableName: T.OTPS,
            Item: {
                email: `admin-delete-${SUPER_ADMIN_EMAIL}`,
                otp,
                adminId,
                expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 mins
            },
        }));

        // Send OTP to super admin email
        const { sendOtpEmail } = await import("../index");
        await sendOtpEmail(
            SUPER_ADMIN_EMAIL,
            otp,
            `Admin Deletion OTP - Deleting ${targetAdmin.name || targetAdmin.email}`
        );

        res.json({ message: `OTP sent to ${maskEmail(SUPER_ADMIN_EMAIL)}`, maskedEmail: maskEmail(SUPER_ADMIN_EMAIL) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE admin with OTP verification
router.delete("/admins/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.params.id;
        const { otp } = req.body;

        if (!otp) return res.status(400).json({ error: "OTP is required" });

        // Can't delete yourself
        if (req.user?.id === adminId) {
            return res.status(403).json({ error: "You cannot delete your own admin account" });
        }

        // Verify target admin exists
        const targetAdmin = await getItem<any>(TABLES.USERS, { id: adminId });
        if (!targetAdmin || targetAdmin.role !== "admin") {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Verify OTP
        const { docClient, TABLES: T } = await import("../db-wrapper");
        const { GetCommand, DeleteCommand } = await import("@aws-sdk/lib-dynamodb");
        const otpResult = await docClient.send(new GetCommand({
            TableName: T.OTPS,
            Key: { email: `admin-delete-${SUPER_ADMIN_EMAIL}` },
        }));

        const storedOtp = otpResult.Item;
        if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Verify the OTP was generated for this specific admin
        if (storedOtp.adminId !== adminId) {
            return res.status(400).json({ error: "OTP was not generated for this admin" });
        }

        // Clean up OTP
        await docClient.send(new DeleteCommand({
            TableName: T.OTPS,
            Key: { email: `admin-delete-${SUPER_ADMIN_EMAIL}` },
        }));

        // Permanently delete the admin
        await deleteItem(TABLES.USERS, { id: adminId });

        res.json({ message: `Admin ${targetAdmin.name || targetAdmin.email} has been permanently deleted` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
