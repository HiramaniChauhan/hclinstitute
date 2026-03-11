import { Router } from "express";
import { generateId, createItem, getAllItems, deleteItem, updateItem } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";

const router = Router();

// Get all notes
router.get("/", async (req, res) => {
    try {
        const notes = await getAllItems(TABLES.NOTES || 'Notes');
        res.json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});

// Create a new note
router.post("/", async (req, res) => {
    try {
        const { title, subject, chapter, uploadedBy, fileType, fileSize, fileData } = req.body;

        if (!title || !subject || !chapter || !fileData) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newNote = {
            id: generateId(),
            title,
            subject,
            chapter,
            uploadedBy: uploadedBy || "Admin",
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

// Update a note (e.g. increase downloads)
router.put("/:id", async (req, res) => {
    try {
        const { downloads, title, subject, chapter } = req.body;

        // simple replacement logic for local mocked db
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

// Delete a note
router.delete("/:id", async (req, res) => {
    try {
        await deleteItem(TABLES.NOTES || 'Notes', { id: req.params.id });
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: "Failed to delete note" });
    }
});

export default router;
