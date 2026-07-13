import { Router } from "express";
import { docClient, TABLES } from "../db-wrapper";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyToken } from "../middleware/auth";

const router = Router();

// Image fields that should be stored in separate DynamoDB items to avoid the 400KB limit
const IMAGE_FIELDS = [
    'directorPhoto',
    'instituteLogo',
    'wallOfFameBottomImage',
    'heroImageLeft',
    'heroImageRight'
];

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
        // Fetch main about doc
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { id: "about_info" }
        }));

        const aboutData = result.Item || {};

        // Fetch all image fields in parallel from their separate items
        const imageResults = await Promise.all(
            IMAGE_FIELDS.map(field =>
                docClient.send(new GetCommand({
                    TableName: TABLES.CONFIG,
                    Key: { id: `about_img_${field}` }
                })).catch(() => ({ Item: null }))
            )
        );

        // Merge images back into the about document
        IMAGE_FIELDS.forEach((field, index) => {
            const item = imageResults[index]?.Item;
            if (item?.data) {
                aboutData[field] = item.data;
            }
        });

        res.json(aboutData);
    } catch (error) {
        console.error("Error fetching about info:", error);
        res.status(500).json({ error: "Failed to fetch about information" });
    }
});

// PUT /api/about - Update the about information (Admin only)
router.put("/", verifyToken, isAdmin, async (req: any, res: any) => {
    try {
        const updateData = { ...req.body };

        // Separate image fields from the main document
        const imageUpdates: { field: string; data: string }[] = [];
        for (const field of IMAGE_FIELDS) {
            if (updateData[field] !== undefined) {
                imageUpdates.push({ field, data: updateData[field] });
                delete updateData[field]; // Remove from main doc
            }
        }

        // Build the main about document (text-only, well under 400KB)
        const aboutDoc = {
            id: "about_info",
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        // Save main doc + all image items in parallel
        const writeOps: Promise<any>[] = [
            docClient.send(new PutCommand({
                TableName: TABLES.CONFIG,
                Item: aboutDoc
            }))
        ];

        for (const img of imageUpdates) {
            if (img.data && img.data.trim() !== "") {
                // Store non-empty image in its own item
                writeOps.push(
                    docClient.send(new PutCommand({
                        TableName: TABLES.CONFIG,
                        Item: {
                            id: `about_img_${img.field}`,
                            data: img.data,
                            updatedAt: new Date().toISOString()
                        }
                    }))
                );
            } else {
                // Image was cleared — store empty so it overrides any old value
                writeOps.push(
                    docClient.send(new PutCommand({
                        TableName: TABLES.CONFIG,
                        Item: {
                            id: `about_img_${img.field}`,
                            data: "",
                            updatedAt: new Date().toISOString()
                        }
                    }))
                );
            }
        }

        await Promise.all(writeOps);

        // Return the full merged document to the client
        const responseDoc = { ...aboutDoc };
        for (const img of imageUpdates) {
            responseDoc[img.field] = img.data;
        }

        res.json(responseDoc);
    } catch (error) {
        console.error("Error updating about info:", error);
        res.status(500).json({ error: "Failed to update about information" });
    }
});

export default router;
