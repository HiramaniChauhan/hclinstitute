import { Router, Response } from "express";
import { verifyToken, AuthRequest } from "../middleware/auth";
import { TABLES } from "../db-wrapper";
import { createItem, deleteItem, queryByField } from "../utils/db-helpers";

const router = Router();

// GET /api/lectures/progress - Get list of completed lecture IDs for the student
router.get("/progress", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user.id;
        const progressRecords = await queryByField<any>(TABLES.LECTURE_PROGRESS, "studentId", studentId);
        const completedIds = progressRecords.map((item: any) => item.lectureId);
        res.json(completedIds);
    } catch (error) {
        console.error("[Backend] Error fetching lecture progress:", error);
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});

// POST /api/lectures/progress - Toggle completion status
router.post("/progress", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { lectureId, completed } = req.body;
        const studentId = req.user.id;

        if (!lectureId) {
            console.error("[Backend] Missing lectureId");
            return res.status(400).json({ error: "Lecture ID is required" });
        }

        const progressId = `progress_${studentId}_${lectureId}`;

        if (completed) {
            await createItem(TABLES.LECTURE_PROGRESS, {
                id: progressId,
                studentId,
                lectureId: String(lectureId),
                completedAt: new Date().toISOString()
            });
        } else {
            await deleteItem(TABLES.LECTURE_PROGRESS, { id: progressId });
        }

        res.json({ message: `Lecture ${completed ? 'marked as done' : 'marked as undone'}` });
    } catch (error) {
        console.error("[Backend] Error updating lecture progress:", error);
        res.status(500).json({ error: "Failed to update progress" });
    }
});

export default router;
