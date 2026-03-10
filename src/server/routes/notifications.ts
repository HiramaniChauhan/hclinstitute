import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, getItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";

const router = Router();

interface NotificationData {
    notificationId: string;
    userId: string;
    title: string;
    message: string;
    type: "announcement" | "verification" | "suspension" | "batch" | "result" | "fee" | "general";
    isRead: boolean;
    createdAt: string;
}

// GET — Current user's notifications (newest first)
router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const notifications = await getAllItems<NotificationData>(
            TABLES.NOTIFICATIONS,
            "userId = :userId",
            { ":userId": req.user.id }
        );

        // Sort newest first
        const sorted = notifications.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        res.json(sorted);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Unread count for current user
router.get("/unread-count", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const notifications = await getAllItems<NotificationData>(
            TABLES.NOTIFICATIONS,
            "userId = :userId",
            { ":userId": req.user.id }
        );

        const unreadCount = notifications.filter(n => !n.isRead).length;
        res.json({ unreadCount });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT — Mark all as read
router.put("/mark-read", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const notifications = await getAllItems<NotificationData>(
            TABLES.NOTIFICATIONS,
            "userId = :userId",
            { ":userId": req.user.id }
        );

        const unread = notifications.filter(n => !n.isRead);
        await Promise.all(
            unread.map(n => createItem(TABLES.NOTIFICATIONS, { ...n, isRead: true }))
        );

        res.json({ message: `Marked ${unread.length} notifications as read` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT — Mark single notification as read
router.put("/:notificationId/read", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const notification = await getItem<NotificationData>(TABLES.NOTIFICATIONS, { notificationId: req.params.notificationId });
        if (!notification) return res.status(404).json({ error: "Notification not found" });
        if (notification.userId !== req.user.id) return res.status(403).json({ error: "Access denied" });

        const updated = { ...notification, isRead: true };
        await createItem(TABLES.NOTIFICATIONS, updated);
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST — Admin sends notification to a specific user
router.post("/send", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { userId, title, message, type } = req.body;
        if (!userId || !title || !message) {
            return res.status(400).json({ error: "userId, title, and message are required" });
        }

        const notification: NotificationData = {
            notificationId: generateId("notif"),
            userId,
            title,
            message,
            type: type || "general",
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        const created = await createItem<NotificationData>(TABLES.NOTIFICATIONS, notification);
        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST — Admin broadcasts notification to all students
router.post("/broadcast", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { title, message, type } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: "title and message are required" });
        }

        const users = await getAllItems<any>(TABLES.USERS);
        const students = users.filter((u: any) => u.role === "student");

        const notifications = students.map((s: any): NotificationData => ({
            notificationId: generateId("notif"),
            userId: s.id,
            title,
            message,
            type: type || "announcement",
            isRead: false,
            createdAt: new Date().toISOString(),
        }));

        await Promise.all(notifications.map(n => createItem<NotificationData>(TABLES.NOTIFICATIONS, n)));
        res.json({ message: `Broadcast sent to ${students.length} students` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
