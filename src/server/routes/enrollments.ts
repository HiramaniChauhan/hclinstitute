import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, getItem, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";

const router = Router();

// Duration is stored as a plain integer = number of months
// e.g. 6 = 6 months, 12 = 1 year, 24 = 2 years
const parseDuration = (duration: string | number, fromDate: Date = new Date()): string | null => {
    const months = parseInt(String(duration));
    if (isNaN(months) || months <= 0) return null;
    const date = new Date(fromDate);
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
};

interface EnrollmentData {
    enrollmentId: string;
    userId: string;
    batchId: string;
    courseId?: string;
    enrolledAt: string;
    expiresAt?: string | null;
    enrolledBy?: string;
    status: "active" | "completed" | "dropped";
}

// POST — Student enrolls in a batch/course
router.post("/", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { batchId, courseId } = req.body;
        if (!batchId) return res.status(400).json({ error: "batchId is required" });

        // Prevent duplicate enrollments
        const existing = await getAllItems<EnrollmentData>(
            TABLES.ENROLLMENTS,
            "userId = :userId",
            { ":userId": req.user.id }
        );
        const alreadyEnrolled = existing.find(e => e.batchId === batchId && e.status === "active");
        if (alreadyEnrolled) {
            return res.status(409).json({ error: "Already enrolled in this batch" });
        }

        const enrollment: EnrollmentData = {
            enrollmentId: generateId(),
            userId: req.user.id,
            batchId,
            courseId,
            enrolledAt: new Date().toISOString(),
            status: "active",
        };

        const createdEnrollment = await createItem(TABLES.ENROLLMENTS, enrollment);

        // Create a fee record for consistency (Paid via batch/later)
        await createItem(TABLES.FEES, {
            feeId: generateId("fee"),
            userId: req.user.id,
            description: `Batch Enrollment: ${batchId}`,
            amount: 0, // Amount may be handled separately for batches
            status: "paid",
            category: "tuition",
            createdAt: enrollment.enrolledAt,
            createdBy: req.user.id,
            dueDate: enrollment.enrolledAt,
            paidAt: enrollment.enrolledAt,
        });

        res.status(201).json(createdEnrollment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST — Direct course enrollment (for testing / free course bypass)
// TODO: Remove or restrict this endpoint before going to production
router.post("/enroll-course", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { courseId } = req.body;
        if (!courseId) return res.status(400).json({ error: "courseId is required" });

        // Prevent duplicate enrollments
        const existing = await getAllItems<EnrollmentData>(
            TABLES.ENROLLMENTS,
            "userId = :userId",
            { ":userId": req.user.id }
        );
        const alreadyEnrolled = existing.find(e => e.courseId === courseId && e.status === "active");
        if (alreadyEnrolled) {
            return res.status(409).json({ error: "Already enrolled in this course" });
        }

        // Fetch the course for duration
        const enrolledCourse = await getItem<any>(TABLES.COURSES, { id: courseId });
        const enrolledAt = new Date().toISOString();
        const expiresAt = enrolledCourse ? parseDuration(enrolledCourse.duration, new Date(enrolledAt)) : null;

        const enrollment: EnrollmentData = {
            enrollmentId: generateId(),
            userId: req.user.id,
            batchId: "direct",
            courseId,
            enrolledAt,
            expiresAt,
            status: "active",
        };

        await createItem(TABLES.ENROLLMENTS, enrollment);

        // Also create a fee record for consistency
        const feeRecord = {
            feeId: generateId("fee"),
            userId: req.user.id,
            courseId,
            description: `Direct Enrollment: ${enrolledCourse?.title || 'Unknown Course'}`,
            amount: 0,
            status: "paid",
            category: "tuition",
            createdAt: enrolledAt,
            createdBy: req.user.id,
            dueDate: enrolledAt,
            paidAt: enrolledAt,
        };
        await createItem(TABLES.FEES, feeRecord);

        res.status(201).json(enrollment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Current student's own enrollments
router.get("/my", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        // Fetch all and filter in JS — mock DB ignores FilterExpression
        const all = await getAllItems<EnrollmentData>(TABLES.ENROLLMENTS);
        const enrollments = all.filter(e => e.userId === req.user!.id);
        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Current student's allowed feature access based on enrolled courses
router.get("/my-access", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        // Fetch all and filter in JS — mock DB ignores FilterExpression
        const all = await getAllItems<EnrollmentData>(TABLES.ENROLLMENTS);
        const now = new Date();
        const activeEnrollments = all.filter(e =>
            e.userId === req.user!.id &&
            e.status === "active" &&
            !!e.courseId &&
            // Exclude expired enrollments (if expiresAt is set and has passed)
            (!e.expiresAt || new Date(e.expiresAt) > now)
        );

        if (activeEnrollments.length === 0) {
            return res.json({ accessFeatures: [] });
        }

        const permittedFeatures = new Set<string>();

        for (const enrollment of activeEnrollments) {
            const course = await getItem<any>(TABLES.COURSES, { id: enrollment.courseId });
            if (course && Array.isArray(course.accessFeatures)) {
                course.accessFeatures.forEach((f: string) => permittedFeatures.add(f));
            }
        }

        res.json({ accessFeatures: Array.from(permittedFeatures) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — All enrollments (Admin)
router.get("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const enrollments = await getAllItems<EnrollmentData>(TABLES.ENROLLMENTS);
        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Enrollments for a specific batch (Admin)
router.get("/batch/:batchId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const enrollments = await getAllItems<EnrollmentData>(
            TABLES.ENROLLMENTS,
            "batchId = :batchId",
            { ":batchId": req.params.batchId }
        );
        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE — Unenroll from a batch
router.delete("/:enrollmentId", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const enrollment = await getItem<EnrollmentData>(TABLES.ENROLLMENTS, { enrollmentId: req.params.enrollmentId });
        if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

        // Only allow owner or admin to delete
        if (enrollment.userId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        await deleteItem(TABLES.ENROLLMENTS, { enrollmentId: req.params.enrollmentId });
        res.json({ message: "Unenrolled successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Enrollments for a specific student (Admin)
router.get("/student/:userId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const all = await getAllItems<EnrollmentData>(TABLES.ENROLLMENTS);
        const enrollments = all.filter(e => e.userId === req.params.userId);
        res.json(enrollments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST — Admin enrolls a student in a course
router.post("/admin/enroll", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { userId, courseId, batchId } = req.body;
        if (!userId || !courseId) return res.status(400).json({ error: "userId and courseId are required" });

        // Check if student exists
        const user = await getItem<any>(TABLES.USERS, { id: userId });
        if (!user || user.role !== "student") return res.status(404).json({ error: "Student not found" });

        // Prevent duplicate enrollments
        const all = await getAllItems<EnrollmentData>(TABLES.ENROLLMENTS);
        const existing = all.find(e => e.userId === userId && e.courseId === courseId && e.status === "active");
        if (existing) return res.status(409).json({ error: "Already enrolled in this course" });

        const enrolledAt = new Date().toISOString();
        const course = await getItem<any>(TABLES.COURSES, { id: courseId });
        const expiresAt = course ? parseDuration(course.duration, new Date(enrolledAt)) : null;

        const enrollment: EnrollmentData = {
            enrollmentId: generateId(),
            userId,
            courseId,
            batchId: batchId || "direct",
            enrolledAt,
            expiresAt,
            enrolledBy: req.user?.id,
            status: "active",
        };

        await createItem(TABLES.ENROLLMENTS, enrollment);

        // Create a $0 fee record for tracking
        await createItem(TABLES.FEES, {
            feeId: generateId("fee"),
            userId,
            courseId,
            description: `Admin Enrollment: ${course?.title || 'Unknown Course'}${batchId ? ` (Batch: ${batchId})` : ''}`,
            amount: 0,
            status: "paid",
            category: "tuition",
            createdAt: enrolledAt,
            createdBy: req.user?.id || "admin",
            dueDate: enrolledAt,
            paidAt: enrolledAt,
        });

        res.status(201).json(enrollment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
