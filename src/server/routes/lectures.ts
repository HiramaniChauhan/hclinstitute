import { Router, Response } from "express";
import { verifyToken, AuthRequest } from "../middleware/auth";
import { docClient, TABLES } from "../db-wrapper";
import { PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const router = Router();

// GET /api/lectures/progress - Get list of completed lecture IDs for the student
router.get("/progress", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user.id;
        console.log(`[Backend] Fetching progress for student: ${studentId}`);
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.LECTURE_PROGRESS,
            FilterExpression: "studentId = :studentId",
            ExpressionAttributeValues: { ":studentId": studentId },
        }));

        const completedIds = result.Items?.map((item: any) => item.lectureId) || [];
        console.log(`[Backend] Found ${completedIds.length} completed lectures`);
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
        console.log(`[Backend] Toggle progress: lecture=${lectureId}, student=${studentId}, completed=${completed}`);

        if (!lectureId) {
            console.error("[Backend] Missing lectureId");
            return res.status(400).json({ error: "Lecture ID is required" });
        }

        const progressId = `progress_${studentId}_${lectureId}`;

        if (completed) {
            console.log(`[Backend] Marking as completed: ${progressId}`);
            await docClient.send(new PutCommand({
                TableName: TABLES.LECTURE_PROGRESS,
                Item: {
                    id: progressId,
                    studentId,
                    lectureId: String(lectureId),
                    completedAt: new Date().toISOString()
                },
            }));
        } else {
            console.log(`[Backend] Removing completion: ${progressId}`);
            await docClient.send(new DeleteCommand({
                TableName: TABLES.LECTURE_PROGRESS,
                Key: { id: progressId }
            }));
        }

        res.json({ message: `Lecture ${completed ? 'marked as done' : 'marked as undone'}` });
    } catch (error) {
        console.error("[Backend] Error updating lecture progress:", error);
        res.status(500).json({ error: "Failed to update progress" });
    }
});

export default router;
