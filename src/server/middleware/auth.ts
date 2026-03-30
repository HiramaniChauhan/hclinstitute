import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { docClient, TABLES } from "../db-wrapper";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
    };
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const secretToUse = JWT_SECRET;

        const decoded = jwt.verify(token, secretToUse) as any;

        // Database sanity check: verify the user still exists and hasn't been deleted
        const dbResult = await docClient.send(new GetCommand({
            TableName: TABLES.USERS,
            Key: { id: decoded.id }
        }));

        if (!dbResult.Item) {
            return res.status(401).json({ error: "User account no longer exists." });
        }

        // Single-Device Login Security: Verify the token's sessionId matches the user's active sessionId
        if (dbResult.Item.sessionId && decoded.sessionId !== dbResult.Item.sessionId) {
            return res.status(401).json({ error: "SESSION_EXPIRED" });
        }

        req.user = decoded;
        next();
    } catch (error: any) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }

        next();
    };
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }

    next();
};
