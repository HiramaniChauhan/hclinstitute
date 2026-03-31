import { docClient, TABLES } from "./db-wrapper";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

// In-memory cache so we only hit DB once per startup
let cachedJwtSecret: string | null = null;

/**
 * Fetches the JWT_SECRET from the Config table in the database.
 * Falls back to the environment variable only to SEED the DB on first run.
 * After that, the DB is the single source of truth.
 */
export async function getJwtSecret(): Promise<string> {
    if (cachedJwtSecret) {
        return cachedJwtSecret;
    }

    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLES.CONFIG,
            Key: { id: "JWT_SECRET" }
        }));

        if (result.Item?.value) {
            cachedJwtSecret = result.Item.value;
            return cachedJwtSecret;
        }

        // If not in DB yet, seed it from the environment variable
        const envSecret = process.env.JWT_SECRET;
        if (!envSecret) {
            throw new Error("[Config] FATAL: JWT_SECRET not found in DB or environment. Server cannot start securely.");
        }

        console.warn("[Config] JWT_SECRET not in DB. Seeding from environment variable...");
        await docClient.send(new PutCommand({
            TableName: TABLES.CONFIG,
            Item: {
                id: "JWT_SECRET",
                value: envSecret,
                seededAt: new Date().toISOString()
            }
        }));

        console.log("[Config] JWT_SECRET seeded to DB from environment. You can now update it via the admin panel and remove it from .env.");
        cachedJwtSecret = envSecret;
        return cachedJwtSecret;

    } catch (error: any) {
        console.error("[Config] Failed to load JWT_SECRET from DB:", error.message);
        throw error;
    }
}

/**
 * Clears the cached JWT_SECRET so it gets re-fetched from DB on next use.
 * Call this after updating the secret in the database.
 */
export function invalidateJwtSecretCache(): void {
    cachedJwtSecret = null;
    console.log("[Config] JWT_SECRET cache invalidated. Will reload from DB on next request.");
}
