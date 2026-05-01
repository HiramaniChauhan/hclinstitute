import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";
import { sendAnnouncementEmailBatch } from "../utils/send-announcement-email";

const router = Router();

// GET all announcements (Admin)
router.get("/", verifyToken, requireAdmin, async (_req, res: Response) => {
    try {
        const announcements = await getAllItems<any>(TABLES.ANNOUNCEMENTS);
        // Sort by createdAt desc
        announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(announcements);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET announcements for the logged-in student
// Returns: "All Students" announcements + any targeted at courses the student is enrolled in
router.get("/my", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        // Get student's enrolled course IDs
        const allEnrollments = await getAllItems<any>(TABLES.ENROLLMENTS);
        const now = new Date();
        const myEnrollments = allEnrollments.filter(e =>
            e.userId === req.user!.id &&
            e.status === "active" &&
            !!e.courseId &&
            (!e.expiresAt || new Date(e.expiresAt) > now)
        );
        const myCourseIds = new Set(myEnrollments.map(e => e.courseId));

        const all = await getAllItems<any>(TABLES.ANNOUNCEMENTS);
        const visible = all.filter(a =>
            a.status === "published" && (
                !a.targetCourseIds ||
                a.targetCourseIds.length === 0 ||
                a.targetCourseIds.includes("all") ||
                a.targetCourseIds.some((id: string) => myCourseIds.has(id))
            )
        ).map(a => ({
            ...a,
            isUnread: !a.readBy?.includes(req.user!.id)
        }));
        visible.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(visible);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Resolve the list of student emails that should receive the announcement.
 *
 * - If targetCourseIds is empty or contains "all" → ALL registered students
 * - If targetCourseIds has specific course IDs → only students enrolled in those courses
 */
async function resolveTargetStudentEmails(targetCourseIds: string[]): Promise<string[]> {
    const allUsers = await getAllItems<any>(TABLES.USERS);
    const students = allUsers.filter(u => u.role === "student" && !u.isDeleted && u.email);

    const isAllStudents =
        !targetCourseIds ||
        targetCourseIds.length === 0 ||
        targetCourseIds.includes("all");

    if (isAllStudents) {
        // Return every student's email
        return students.map(s => s.email);
    }

    // Course-specific: find enrolled students
    const allEnrollments = await getAllItems<any>(TABLES.ENROLLMENTS);
    const now = new Date();
    const targetCourseSet = new Set(targetCourseIds);

    const enrolledUserIds = new Set(
        allEnrollments
            .filter(e =>
                e.status === "active" &&
                !!e.courseId &&
                targetCourseSet.has(e.courseId) &&
                (!e.expiresAt || new Date(e.expiresAt) > now)
            )
            .map(e => e.userId)
    );

    return students
        .filter(s => enrolledUserIds.has(s.id))
        .map(s => s.email);
}

// POST create announcement (Admin)
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const { title, content, priority, targetCourseIds, category, pinned, status } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Title and content are required" });

        const announcement = {
            id: generateId(),
            title,
            content,
            priority: priority || "medium",
            targetCourseIds: targetCourseIds || [],   // [] or ["all"] = all students; [courseId,...] = specific
            category: category || "General",
            pinned: !!pinned,
            status: status || "published",
            readBy: [], // Array of user IDs who have read this
            author: req.user.firstName || "Admin",
            createdAt: new Date().toISOString(),
            views: 0,
        };

        await createItem(TABLES.ANNOUNCEMENTS, announcement);

        // ── Send announcement emails asynchronously (fire-and-forget) ─────────
        // Only send emails for "published" announcements (not drafts)
        if (announcement.status === "published") {
            // Run in background — don't await so the API response stays fast
            (async () => {
                try {
                    const emails = await resolveTargetStudentEmails(announcement.targetCourseIds);
                    if (emails.length > 0) {
                        console.log(`[Announcement] Sending email to ${emails.length} student(s) for: "${announcement.title}"`);
                        const result = await sendAnnouncementEmailBatch(emails, {
                            title: announcement.title,
                            content: announcement.content,
                            priority: announcement.priority,
                            category: announcement.category,
                            author: announcement.author,
                        });
                        console.log(`[Announcement] Email dispatch done: ${result.sent} sent, ${result.failed} failed`);
                    } else {
                        console.log(`[Announcement] No target students found for: "${announcement.title}"`);
                    }
                } catch (emailErr) {
                    console.error("[Announcement] Background email dispatch error:", emailErr);
                }
            })();
        }

        res.status(201).json(announcement);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update announcement (Admin)
router.put("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const all = await getAllItems<any>(TABLES.ANNOUNCEMENTS);
        const existing = all.find(a => a.id === req.params.id);
        if (!existing) return res.status(404).json({ error: "Announcement not found" });

        const updated = { ...existing, ...req.body, id: existing.id, createdAt: existing.createdAt };
        await createItem(TABLES.ANNOUNCEMENTS, updated);
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE an announcement (Admin)
router.delete("/:id", verifyToken, requireAdmin, async (req, res: Response) => {
    try {
        await deleteItem(TABLES.ANNOUNCEMENTS, { id: req.params.id });
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST mark an announcement as read
router.post("/:id/read", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const all = await getAllItems<any>(TABLES.ANNOUNCEMENTS);
        const existing = all.find(a => a.id === req.params.id);
        if (!existing) return res.status(404).json({ error: "Announcement not found" });

        // Add user ID to readBy array if not already there
        const readBy = existing.readBy || [];
        if (!readBy.includes(req.user.id)) {
            readBy.push(req.user.id);
            const updated = { ...existing, readBy };
            await createItem(TABLES.ANNOUNCEMENTS, updated);
            return res.json({ success: true, updated });
        }

        res.json({ success: true, alreadyRead: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
