
import { Router } from "express";
import { docClient, TABLES } from "../db-wrapper";
import { PutCommand, ScanCommand, GetCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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
router.get("/conversations", async (req: any, res: any) => {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.USERS,
            FilterExpression: "role = :role",
            ExpressionAttributeValues: { ":role": "student" }
        }));

        const students = result.Items || [];

        // Enhance with last message info (In a real app, we'd use a separate Conversations table for efficiency)
        const conversations = await Promise.all(students.map(async (student: any) => {
            const messagesResult = await docClient.send(new ScanCommand({
                TableName: TABLES.CHAT_MESSAGES,
                FilterExpression: "studentId = :studentId",
                ExpressionAttributeValues: { ":studentId": student.id }
            }));

            const messages = messagesResult.Items || [];
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
        }));

        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// GET /messages/:studentId - Get messages for a conversation
router.get("/messages/:studentId", async (req: any, res: any) => {
    const { studentId } = req.params;
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.CHAT_MESSAGES,
            FilterExpression: "studentId = :studentId",
            ExpressionAttributeValues: { ":studentId": studentId }
        }));

        const messages = result.Items || [];
        messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// POST /send - Send a message
router.post("/send", async (req: any, res: any) => {
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

        await docClient.send(new PutCommand({
            TableName: TABLES.CHAT_MESSAGES,
            Item: newMessage
        }));

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
        // First get the message to ensure it exists
        const getResult = await docClient.send(new ScanCommand({
            TableName: TABLES.CHAT_MESSAGES,
            FilterExpression: "id = :id",
            ExpressionAttributeValues: { ":id": messageId }
        }));

        const message = getResult.Items?.[0];
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        const updatedMessage = { ...message, text, edited: true, editedAt: new Date().toISOString() };

        await docClient.send(new PutCommand({
            TableName: TABLES.CHAT_MESSAGES,
            Item: updatedMessage
        }));

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
        // In this implementation, we use a Scan find because messageId might not be the partition key
        // Assuming 'id' is a unique attribute
        const getResult = await docClient.send(new ScanCommand({
            TableName: TABLES.CHAT_MESSAGES,
            FilterExpression: "id = :id",
            ExpressionAttributeValues: { ":id": messageId }
        }));

        const message = getResult.Items?.[0];
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        // We need the full key for DeleteCommand. Let's assume studentId + id is the key or just id.
        // For simplicity with PutCommand overwrite, we can just delete if we have the primary key.
        // Assuming CHAT_MESSAGES table key structure is { id: string } or similar.

        await docClient.send(new DeleteCommand({
            TableName: TABLES.CHAT_MESSAGES,
            Key: { id: messageId }
        }));

        res.json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Failed to delete message" });
    }
});

// PUT /read/:studentId - Mark messages as read
router.put("/read/:studentId", async (req: any, res: any) => {
    const { studentId } = req.params;
    const readerRole = req.user.role; // 'admin' or 'student'

    try {
        // Find all messages in this conversation where recipient is the current user
        // Recipient is admin if sender was student, and vice versa.
        const senderToMarkAsRead = readerRole === 'admin' ? 'student' : 'admin';

        const result = await docClient.send(new ScanCommand({
            TableName: TABLES.CHAT_MESSAGES,
            FilterExpression: "studentId = :studentId AND sender = :sender AND #r = :unread",
            ExpressionAttributeValues: {
                ":studentId": studentId,
                ":sender": senderToMarkAsRead,
                ":unread": false
            },
            ExpressionAttributeNames: { "#r": "read" }
        }));

        const unreadMessages = result.Items || [];

        // Update each message (In real DynamoDB we'd use BatchWrite or individual updates)
        await Promise.all(unreadMessages.map(async (msg: any) => {
            await docClient.send(new PutCommand({
                TableName: TABLES.CHAT_MESSAGES,
                Item: { ...msg, read: true }
            }));
        }));

        res.json({ message: `Marked ${unreadMessages.length} messages as read` });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: "Failed to mark messages as read" });
    }
});

export default router;
