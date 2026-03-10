import { Router } from "express";
import { verifyToken, requireAdmin, AuthRequest } from "../middleware/auth";
import { createItem, getAllItems, getItem, deleteItem, generateId } from "../utils/db-helpers";
import { TABLES } from "../db-wrapper";
import { Response } from "express";

const router = Router();

interface FeeRecord {
    feeId: string;
    userId: string;         // student ID
    amount: number;
    description: string;
    dueDate: string;
    status: "pending" | "paid" | "overdue" | "waived";
    paidAt?: string;
    paidBy?: string;        // student or admin who marked it paid
    createdBy: string;      // admin ID
    createdAt: string;
    category: "tuition" | "exam" | "library" | "hostel" | "other";
}

// POST — Admin creates a fee record for a student
router.post("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { userId, amount, description, dueDate, category } = req.body;
        if (!userId || !amount || !description || !dueDate) {
            return res.status(400).json({ error: "userId, amount, description, and dueDate are required" });
        }

        const fee: FeeRecord = {
            feeId: generateId("fee"),
            userId,
            amount,
            description,
            dueDate,
            status: "pending",
            createdBy: req.user?.id || "",
            createdAt: new Date().toISOString(),
            category: category || "tuition",
        };

        const created = await createItem<FeeRecord>(TABLES.FEES, fee);

        // Notify student
        await createItem(TABLES.NOTIFICATIONS, {
            notificationId: generateId("notif"),
            userId,
            title: "Fee Due",
            message: `A new fee of ₹${amount} for "${description}" is due by ${new Date(dueDate).toLocaleDateString("en-IN")}.`,
            type: "fee",
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Student views their own fee records
router.get("/my", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const fees = await getAllItems<FeeRecord>(
            TABLES.FEES,
            "userId = :userId",
            { ":userId": req.user.id }
        );

        const sorted = fees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const totalAmount = sorted.reduce((sum, f) => sum + f.amount, 0);
        const totalPaid = sorted.filter(f => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
        const totalPending = sorted.filter(f => f.status === "pending" || f.status === "overdue").reduce((sum, f) => sum + f.amount, 0);

        res.json({
            fees: sorted,
            summary: { totalAmount, totalPaid, totalPending }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — All fee records (Admin)
router.get("/", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const fees = await getAllItems<FeeRecord>(TABLES.FEES);
        res.json(fees);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET — Fee records for a specific student (Admin)
router.get("/student/:userId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const fees = await getAllItems<FeeRecord>(
            TABLES.FEES,
            "userId = :userId",
            { ":userId": req.params.userId }
        );
        res.json(fees);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT — Student pays a fee (or Admin marks as paid)
router.put("/:feeId/pay", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        const fee = await getItem<FeeRecord>(TABLES.FEES, { feeId: req.params.feeId });
        if (!fee) return res.status(404).json({ error: "Fee record not found" });

        // Students can only pay their own fees; admins can pay anyone's
        if (fee.userId !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "Access denied" });
        }

        if (fee.status === "paid") {
            return res.status(409).json({ error: "Fee is already paid" });
        }

        const updated: FeeRecord = {
            ...fee,
            status: "paid",
            paidAt: new Date().toISOString(),
            paidBy: req.user.id,
        };

        await createItem<FeeRecord>(TABLES.FEES, updated);

        // Notify student if admin paid it
        if (req.user.role === "admin" && fee.userId !== req.user.id) {
            await createItem(TABLES.NOTIFICATIONS, {
                notificationId: generateId("notif"),
                userId: fee.userId,
                title: "Fee Marked Paid",
                message: `Your fee of ₹${fee.amount} for "${fee.description}" has been marked as paid.`,
                type: "fee",
                isRead: false,
                createdAt: new Date().toISOString(),
            });
        }

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT — Admin waives a fee
router.put("/:feeId/waive", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const fee = await getItem<FeeRecord>(TABLES.FEES, { feeId: req.params.feeId });
        if (!fee) return res.status(404).json({ error: "Fee record not found" });

        const updated: FeeRecord = { ...fee, status: "waived", paidBy: req.user?.id };
        await createItem<FeeRecord>(TABLES.FEES, updated);

        // Notify student
        await createItem(TABLES.NOTIFICATIONS, {
            notificationId: generateId("notif"),
            userId: fee.userId,
            title: "Fee Waived",
            message: `Your fee of ₹${fee.amount} for "${fee.description}" has been waived.`,
            type: "fee",
            isRead: false,
            createdAt: new Date().toISOString(),
        });

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE — Admin deletes a fee record
router.delete("/:feeId", verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const fee = await getItem<FeeRecord>(TABLES.FEES, { feeId: req.params.feeId });
        if (!fee) return res.status(404).json({ error: "Fee record not found" });

        await deleteItem(TABLES.FEES, { feeId: req.params.feeId });
        res.json({ message: "Fee record deleted" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
