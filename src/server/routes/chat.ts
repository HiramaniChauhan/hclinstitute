
import { Router } from "express";
import { TABLES } from "../db-wrapper";
import { getAllItems, getItem, createItem, deleteItem, queryByField } from "../utils/db-helpers";
import { validate, sendMessageSchema } from "../middleware/validate";

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};

// GET /conversations - List all student conversations (Admin only)
router.get("/conversations", isAdmin, async (req: any, res: any) => {
    try {
        // Fetch students and ALL messages in just 2 parallel calls
        const [allUsers, allMessages] = await Promise.all([
            getAllItems<any>(TABLES.USERS),
            getAllItems<any>(TABLES.CHAT_MESSAGES),
        ]);

        const students = allUsers.filter((u: any) => u.role === "student");

        // Group messages by studentId in memory (O(n) instead of N scans)
        const messagesByStudent: Record<string, any[]> = {};
        for (const msg of allMessages) {
            if (!msg.studentId) continue;
            if (!messagesByStudent[msg.studentId]) messagesByStudent[msg.studentId] = [];
            messagesByStudent[msg.studentId].push(msg);
        }

        const conversations = students.map((student: any) => {
            const messages = messagesByStudent[student.id] || [];
            messages.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            return {
                id: student.id,
                name: student.name,
                role: 'student',
                lastMessage: messages[0]?.text || "No messages yet",
                time: messages[0]?.timestamp || student.createdAt,
                unread: messages.filter((m: any) => m.sender === 'student' && !m.read).length,
                subject: 'Support'
            };
        });

        // Sort conversations by latest message time
        conversations.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// GET /unread-count - Get total unread messages for current user
router.get("/unread-count", async (req: any, res: any) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;

        if (userRole === 'student') {
            // Student: find unread messages sent by admin to this student
            const messages = await queryByField<any>(TABLES.CHAT_MESSAGES, "studentId", userId);
            const unread = messages.filter((m: any) => m.sender === 'admin' && !m.read);
            res.json({ count: unread.length });
        } else {
            // Admin: find unread messages sent by ANY student
            const allMessages = await getAllItems<any>(TABLES.CHAT_MESSAGES);
            const unread = allMessages.filter((m: any) => m.sender === 'student' && !m.read);
            res.json({ count: unread.length });
        }
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Failed to fetch unread count" });
    }
});

// GET /messages/:studentId - Get messages for a conversation
router.get("/messages/:studentId", async (req: any, res: any) => {
    const { studentId } = req.params;

    // Students can only access their own messages
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
        return res.status(403).json({ error: "Access denied" });
    }
    try {
        const messages = await queryByField<any>(TABLES.CHAT_MESSAGES, "studentId", studentId);
        messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// POST /send - Send a message
router.post("/send", validate(sendMessageSchema), async (req: any, res: any) => {
    const { studentId, text, type, attachmentUrl } = req.body;
    const sender = req.user.role; // 'admin' or 'student'
    const senderId = req.user.id;

    try {
        const messageId = Date.now().toString();
        const newMessage = {
            id: messageId,
            studentId: studentId || (sender === 'student' ? senderId : null),
            sender,
            senderId,
            text,
            type: type || 'text',
            attachmentUrl: attachmentUrl || null,
            timestamp: new Date().toISOString(),
            read: false
        };

        if (!newMessage.studentId) {
            return res.status(400).json({ error: "Student ID is required" });
        }

        await createItem(TABLES.CHAT_MESSAGES, newMessage);
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// PUT /:messageId - Edit a message (Admin only)
router.put("/:messageId", isAdmin, async (req: any, res: any) => {
    const { messageId } = req.params;
    const { text } = req.body;

    try {
        const message = await getItem<any>(TABLES.CHAT_MESSAGES, { id: messageId });
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        const updatedMessage = { ...message, text, edited: true, editedAt: new Date().toISOString() };
        await createItem(TABLES.CHAT_MESSAGES, updatedMessage);

        res.json(updatedMessage);
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ error: "Failed to edit message" });
    }
});

// DELETE /:messageId - Delete a message (Admin only)
router.delete("/:messageId", isAdmin, async (req: any, res: any) => {
    const { messageId } = req.params;

    try {
        const message = await getItem<any>(TABLES.CHAT_MESSAGES, { id: messageId });
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        await deleteItem(TABLES.CHAT_MESSAGES, { id: messageId });
        res.json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Failed to delete message" });
    }
});

// PUT /read/:studentId - Mark messages as read
router.put("/read/:studentId", async (req: any, res: any) => {
    const { studentId } = req.params;
    const readerRole = req.user.role;

    // Students can only mark their own conversation as read
    if (readerRole !== 'admin' && req.user.id !== studentId) {
        return res.status(403).json({ error: "Access denied" });
    }

    try {
        const senderToMarkAsRead = readerRole === 'admin' ? 'student' : 'admin';

        // Use GSI query instead of ScanCommand
        const messages = await queryByField<any>(TABLES.CHAT_MESSAGES, "studentId", studentId);
        const unreadMessages = messages.filter(
            (m: any) => m.sender === senderToMarkAsRead && !m.read
        );

        // Update each message
        await Promise.all(unreadMessages.map(async (msg: any) => {
            await createItem(TABLES.CHAT_MESSAGES, { ...msg, read: true });
        }));

        res.json({ message: `Marked ${unreadMessages.length} messages as read` });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: "Failed to mark messages as read" });
    }
});

export default router;
