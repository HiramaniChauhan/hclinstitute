import { Router, Response } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { getItem, updateItem, getAllItems, createItem, deleteItem } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";

const router = Router();

interface SelectedStudent {
    id: string;
    name: string;
    photo?: string;
    rank: number;
    collegeAllotted: string;
    linkedinId?: string;
    batch: string;
    year: string;
    createdAt: string;
}

// GET all selected students (supports year filter)
router.get("/", async (req, res) => {
    try {
        const { year } = req.query;
        let students = await getAllItems<SelectedStudent>(TABLES.SELECTED_STUDENTS);

        if (year) {
            students = students.filter(s => s.year === year);
        }

        // Sort by rank
        students.sort((a, b) => a.rank - b.rank);

        res.json(students);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST add selected student (Admin only)
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const studentData = req.body;
        const id = Date.now().toString();

        const newStudent: SelectedStudent = {
            ...studentData,
            id,
            createdAt: new Date().toISOString()
        };

        await createItem(TABLES.SELECTED_STUDENTS, newStudent);
        res.status(201).json(newStudent);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE selected student (Admin only)
router.delete("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await deleteItem(TABLES.SELECTED_STUDENTS, { id });
        res.json({ message: "Selected student removed successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update selected student (Admin only)
router.put("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const studentData = req.body;

        // Ensure ID remains consistent
        const updatedStudent = {
            ...studentData,
            id,
            updatedAt: new Date().toISOString()
        };

        await createItem(TABLES.SELECTED_STUDENTS, updatedStudent);
        res.json(updatedStudent);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
