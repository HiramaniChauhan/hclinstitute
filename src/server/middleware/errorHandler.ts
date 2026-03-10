import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[Server Error]", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
    });
};
