import { Router } from "express";
import { generateId, createItem, getAllItems, deleteItem, updateItem } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";

const router = Router();

// Get all courses
router.get("/", async (req, res) => {
    try {
        const rawResult = await getAllItems(TABLES.COURSES);
        const courses = rawResult || [];
        console.log(`[Courses Route] Found ${courses.length} courses in DB`);
        res.json(courses);
    } catch (error) {
        console.error("Error fetching courses", error);
        res.status(500).json({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) });
    }
});

// Create a new course
router.post("/", async (req, res) => {
    try {
        const newCourse = {
            id: generateId(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        await createItem(TABLES.COURSES, newCourse);
        res.status(201).json(newCourse);
    } catch (error) {
        console.error("Error creating course", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update a course
router.put("/:id", async (req, res) => {
    try {
        const courseId = req.params.id;
        const existingCourses = await getAllItems(TABLES.COURSES);
        const courseToUpdate = existingCourses.find((c: any) => c.id === courseId);

        if (!courseToUpdate) {
            res.status(404).json({ error: "Course not found" });
            return;
        }

        const updatedCourse = Object.assign({}, courseToUpdate, req.body);
        await createItem(TABLES.COURSES, updatedCourse);
        res.json(updatedCourse);
    } catch (error) {
        console.error("Error updating course", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete a course
router.delete("/:id", async (req, res) => {
    try {
        await deleteItem(TABLES.COURSES, { id: req.params.id });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting course", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
