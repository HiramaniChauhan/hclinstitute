import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";

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
        );
        visible.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(visible);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

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
            author: req.user.firstName || req.user.email || "Admin",
            createdAt: new Date().toISOString(),
            views: 0,
        };

        await createItem(TABLES.ANNOUNCEMENTS, announcement);
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

export default router;
