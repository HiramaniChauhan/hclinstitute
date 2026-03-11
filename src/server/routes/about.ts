import { Router } from "express";
import { docClient, TABLES } from "../db-wrapper";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyToken } from "../middleware/auth";

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Access denied. Admins only." });
    }
};

// GET /api/about - Fetch the public about information
router.get("/", async (req: any, res: any) => {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { id: "about_info" }
        }));

        res.json(result.Item || {});
    } catch (error) {
        console.error("Error fetching about info:", error);
        res.status(500).json({ error: "Failed to fetch about information" });
    }
});

// PUT /api/about - Update the about information (Admin only)
router.put("/", verifyToken, isAdmin, async (req: any, res: any) => {
    try {
        const updateData = req.body;

        // Ensure the ID is always 'about_info'
        const aboutDoc = {
            id: "about_info",
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: TABLES.CONFIG,
            Item: aboutDoc
        }));

        res.json(aboutDoc);
    } catch (error) {
        console.error("Error updating about info:", error);
        res.status(500).json({ error: "Failed to update about information" });
    }
});

export default router;
