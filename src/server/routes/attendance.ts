import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, getItem, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";

const router = Router();

interface AttendanceRecord {
    attendanceId: string;
    userId: string;         // student ID
    batchId: string;
    lectureId?: string;
    date: string;           // ISO date string
    status: "present" | "absent" | "late";
    markedBy: string;       // admin ID
    markedAt: string;
    notes?: string;
}

// POST — Admin marks attendance for a student
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { userId, batchId, lectureId, date, status, notes } = req.body;
        if (!userId || !batchId || !date || !status) {
            return res.status(400).json({ error: "userId, batchId, date, and status are required" });
        }

        const record: AttendanceRecord = {
            attendanceId: generateId("att"),
            userId,
            batchId,
            lectureId,
            date,
            status,
            markedBy: req.user?.id || "",
            markedAt: new Date().toISOString(),
            notes,
        };

        const created = await createItem<AttendanceRecord>(TABLES.ATTENDANCE, record);
        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST — Admin marks bulk attendance for a whole batch (array of {userId, status})
router.post("/bulk", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { batchId, lectureId, date, records } = req.body;
        if (!batchId || !date || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: "batchId, date, and records[] are required" });
        }

        const attendanceRecords: AttendanceRecord[] = records.map((r: any) => ({
            attendanceId: generateId("att"),
            userId: r.userId,
            batchId,
            lectureId,
            date,
            status: r.status,
            markedBy: req.user?.id || "",
            markedAt: new Date().toISOString(),
            notes: r.notes,
        }));

        await Promise.all(attendanceRecords.map(r => createItem<AttendanceRecord>(TABLES.ATTENDANCE, r)));
        res.status(201).json({ message: `Marked attendance for ${attendanceRecords.length} students`, records: attendanceRecords });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Student views their own attendance
router.get("/my", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const records = await getAllItems<AttendanceRecord>(
            TABLES.ATTENDANCE,
            "userId = :userId",
            { ":userId": req.user.id }
        );

        const sorted = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const total = sorted.length;
        const present = sorted.filter(r => r.status === "present").length;
        const late = sorted.filter(r => r.status === "late").length;
        const absent = sorted.filter(r => r.status === "absent").length;
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        res.json({ records: sorted, summary: { total, present, late, absent, percentage } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Admin views attendance for a batch
router.get("/batch/:batchId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const records = await getAllItems<AttendanceRecord>(
            TABLES.ATTENDANCE,
            "batchId = :batchId",
            { ":batchId": req.params.batchId }
        );
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Admin views attendance for a specific student
router.get("/student/:userId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const records = await getAllItems<AttendanceRecord>(
            TABLES.ATTENDANCE,
            "userId = :userId",
            { ":userId": req.params.userId }
        );
        const sorted = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(sorted);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — All attendance records (Admin)
router.get("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const records = await getAllItems<AttendanceRecord>(TABLES.ATTENDANCE);
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE — Remove an attendance record (Admin)
router.delete("/:attendanceId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const record = await getItem<AttendanceRecord>(TABLES.ATTENDANCE, { attendanceId: req.params.attendanceId });
        if (!record) return res.status(404).json({ error: "Attendance record not found" });

        await deleteItem(TABLES.ATTENDANCE, { attendanceId: req.params.attendanceId });
        res.json({ message: "Attendance record deleted" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
