import { Router } from "express";
import express from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { generateId, createItem, getAllItems, deleteItem } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";

const router = Router();

// Large body parser for file uploads (base64 notes can be up to 50MB)
const largeBodyParser = express.json({ limit: '50mb' });

// GET all notes — any logged-in user can read notes
router.get("/", verifyToken, async (req, res) => {
    try {
        const notes = await getAllItems(TABLES.NOTES || 'Notes');
        // Strip uploadedBy so student portal never sees uploader ID
        const sanitized = (notes as any[]).map(({ uploadedBy, ...rest }) => rest);
        res.json(sanitized);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});

// Create a new note — Admin only
router.post("/", largeBodyParser, verifyToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { title, subject, chapter, fileType, fileSize, fileData } = req.body;

        if (!title || !subject || !chapter || !fileData) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newNote = {
            id: generateId(),
            title,
            subject,
            chapter,
            uploadedBy: req.user?.id || "Admin",
            uploadDate: new Date().toISOString().split('T')[0],
            fileType: fileType || "PDF",
            fileSize: fileSize || "Unknown",
            fileData,
            downloads: 0
        };

        await createItem(TABLES.NOTES || 'Notes', newNote);
        res.status(201).json(newNote);
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ error: "Failed to create note" });
    }
});

// Update a note (e.g. increase downloads) — Admin only for edits
router.put("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { downloads, title, subject, chapter } = req.body;

        const notes: any[] = await getAllItems(TABLES.NOTES || 'Notes');
        const existingNote = notes.find(n => n.id === req.params.id);

        if (!existingNote) {
            return res.status(404).json({ error: "Note not found" });
        }

        const updatedNote = {
            ...existingNote,
            ...(title && { title }),
            ...(subject && { subject }),
            ...(chapter && { chapter }),
            ...(downloads !== undefined && { downloads })
        };

        await createItem(TABLES.NOTES || 'Notes', updatedNote);
        res.json(updatedNote);
    } catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ error: "Failed to update note" });
    }
});

// Increment download count — any logged-in student can call this
router.post("/:id/download", verifyToken, async (req, res) => {
    try {
        const notes: any[] = await getAllItems(TABLES.NOTES || 'Notes');
        const note = notes.find(n => n.id === req.params.id);
        if (!note) return res.status(404).json({ error: "Note not found" });

        await createItem(TABLES.NOTES || 'Notes', {
            ...note,
            downloads: (note.downloads || 0) + 1
        });
        res.json({ message: "Download counted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update download count" });
    }
});

// Delete a note — Admin only
router.delete("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
        await deleteItem(TABLES.NOTES || 'Notes', { id: req.params.id });
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: "Failed to delete note" });
    }
});

export default router;
