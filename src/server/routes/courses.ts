import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { generateId, createItem, getAllItems, deleteItem } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";

const router = Router();

// GET all courses — public read (anyone can view courses for the landing page)
router.get("/", async (req, res) => {
    try {
        const [rawCourses, allEnrollments] = await Promise.all([
            getAllItems<any>(TABLES.COURSES),
            getAllItems<any>(TABLES.ENROLLMENTS)
        ]);

        const courses = (rawCourses || []).map(course => ({
            ...course,
            enrolledCount: allEnrollments.filter(e => e.courseId === course.id && e.status === "active").length
        })); res.json(courses);
    } catch (error) {
        console.error("Error fetching courses", error);
        res.status(500).json({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) });
    }
});

// Create a new course — Admin only
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const newCourse = {
            id: generateId(),
            ...req.body,
            createdBy: req.user?.id,
            createdAt: new Date().toISOString()
        };
        await createItem(TABLES.COURSES, newCourse);
        res.status(201).json(newCourse);
    } catch (error) {
        console.error("Error creating course", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update a course — Admin only
router.put("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const courseId = req.params.id;
        const existingCourses = await getAllItems(TABLES.COURSES);
        const courseToUpdate = existingCourses.find((c: any) => c.id === courseId);

        if (!courseToUpdate) {
            res.status(404).json({ error: "Course not found" });
            return;
        }

        const updatedCourse = Object.assign({}, courseToUpdate, req.body, {
            updatedAt: new Date().toISOString()
        });
        await createItem(TABLES.COURSES, updatedCourse);
        res.json(updatedCourse);
    } catch (error) {
        console.error("Error updating course", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete a course — Admin only
router.delete("/:id", verifyToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
        await deleteItem(TABLES.COURSES, { id: req.params.id });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting course", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
