import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getItem, getAllItems, updateItem, deleteItem } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";

const router = Router();

// GET all videos
router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const videos = await getAllItems(TABLES.VIDEOS);
        res.json(videos || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST save a new video
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const videoData = req.body;
        if (!videoData.title || (!videoData.url && !videoData.youtubeUrl) || !videoData.subject) {
            return res.status(400).json({ error: "Missing required fields (title, url, subject)" });
        }

        const videoId = `vid_${Date.now()}`;
        const item = {
            ...videoData,
            id: videoId,
            type: videoData.type || 'youtube',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: videoData.status || 'Published',
            views: 0
        };

        await createItem(TABLES.VIDEOS, item);
        res.status(201).json(item);
    } catch (error: any) {
        console.error("Error creating video:", error);
        res.status(500).json({ error: "Failed to create video" });
    }
});

// PUT update a video (for status changes)
router.put("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existingVideo = await getItem<any>(TABLES.VIDEOS, { id });
        if (!existingVideo) {
            return res.status(404).json({ error: "Video not found" });
        }

        const updatedItem = {
            ...existingVideo,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // We use createItem as PutCommand overwrites the entire item
        await createItem(TABLES.VIDEOS, updatedItem);
        res.json(updatedItem);
    } catch (error: any) {
        console.error("Error updating video:", error);
        res.status(500).json({ error: "Failed to update video" });
    }
});

// DELETE a video
router.delete("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await deleteItem(TABLES.VIDEOS, { id });
        res.json({ message: "Video deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
