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
    };
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        console.warn("[Auth] No token provided in header:", authHeader);
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const secretToUse = JWT_SECRET;
        const envSecret = process.env.JWT_SECRET || "FALLBACK";

        console.log(`[Auth] VERIFY Check:
            Secret Length: ${secretToUse.length}
            Env Secret Length: ${envSecret.length}
            Secret Match: ${secretToUse === envSecret}
            Server Time: ${new Date().toISOString()}
            Token Start: ${token.substring(0, 10)}...
        `);

        const decoded = jwt.verify(token, secretToUse) as any;
        console.log("[Auth] Token Decoded Successfully:", { id: decoded.id, role: decoded.role, exp: new Date(decoded.exp * 1000).toISOString() });

        // Database sanity check: verify the user still exists and hasn't been deleted
        const dbResult = await docClient.send(new GetCommand({
            TableName: TABLES.USERS,
            Key: { id: decoded.id }
        }));

        if (!dbResult.Item) {
            console.warn("[Auth] Token valid, but user no longer exists in DB. Logging out.");
            return res.status(401).json({ error: "User account no longer exists." });
        }

        req.user = decoded;
        next();
    } catch (error: any) {
        console.error("[Auth] Token verification failed!", {
            message: error.message,
            name: error.name,
            secretLength: JWT_SECRET.length,
            time: new Date().toISOString()
        });

        if (error.name === 'TokenExpiredError') {
            console.error("[Auth] Token expired at:", new Date(error.expiredAt).toISOString());
        }
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
