import { GetCommand, PutCommand, ScanCommand, DeleteCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, isMemory } from "../db-wrapper";

export const generateId = (prefix?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${id}` : id;
};

export async function getItem<T>(tableName: string, key: any): Promise<T | null> {
    const result = await docClient.send(new GetCommand({ TableName: tableName, Key: key }));
    return (result.Item as T) || null;
}

export async function getAllItems<T>(tableName: string, filterExpression?: string, expressionAttributeValues?: any): Promise<T[]> {
    const params: any = { TableName: tableName };
    if (filterExpression && expressionAttributeValues) {
        params.FilterExpression = filterExpression;
        params.ExpressionAttributeValues = expressionAttributeValues;
    }
    // DynamoDB Scan has a 1MB per-request limit — paginate with LastEvaluatedKey
    const allItems: T[] = [];
    let lastKey: any = undefined;
    do {
        if (lastKey) params.ExclusiveStartKey = lastKey;
        const result = await docClient.send(new ScanCommand(params));
        if (result.Items) allItems.push(...(result.Items as T[]));
        lastKey = result.LastEvaluatedKey;
    } while (lastKey);
    return allItems;
}

/**
 * Paginated version of getAllItems.
 * Returns { items, total } where items is the current page.
 */
export async function getAllItemsPaginated<T>(
    tableName: string,
    options: { page?: number; limit?: number; filterExpression?: string; expressionAttributeValues?: any } = {}
): Promise<{ items: T[]; total: number }> {
    const { page = 1, limit = 50, filterExpression, expressionAttributeValues } = options;

    const params: any = { TableName: tableName };
    if (filterExpression && expressionAttributeValues) {
        params.FilterExpression = filterExpression;
        params.ExpressionAttributeValues = expressionAttributeValues;
    }

    const result = await docClient.send(new ScanCommand(params));
    const allItems = (result.Items as T[]) || [];
    const total = allItems.length;
    const start = (page - 1) * limit;
    const items = allItems.slice(start, start + limit);

    return { items, total };
}

// ── GSI Map — field → GSI name per table ──────────────────────────────────────
// When a GSI exists, queryByField uses QueryCommand (reads only matching items)
// instead of ScanCommand (reads ALL items and filters).
const GSI_MAP: Record<string, Record<string, string>> = {
    Users:           { email: "EmailIndex" },
    Enrollments:     { userId: "UserIdIndex" },
    Results:         { userId: "UserIdIndex", testId: "TestIdIndex" },
    Notifications:   { userId: "UserIdIndex" },
    Fees:            { userId: "UserIdIndex" },
    ChatMessages:    { studentId: "StudentIdIndex" },
    ChapterResults:  { userId: "UserIdIndex" },
    LectureProgress: { studentId: "StudentIdIndex" },
    Reviews:         { studentId: "StudentIdIndex", targetId: "TargetIdIndex" },
};

/**
 * Query items by a single field using a GSI (if available).
 * Falls back to Scan + filter if no GSI is configured for that table/field.
 * This is much cheaper than getAllItems() for DynamoDB.
 */
export async function queryByField<T>(tableName: string, field: string, value: any): Promise<T[]> {
    const gsiName = GSI_MAP[tableName]?.[field];

    if (gsiName && !isMemory) {
        try {
            // Use GSI — reads only matching items (cost efficient)
            const result = await docClient.send(new QueryCommand({
                TableName: tableName,
                IndexName: gsiName,
                KeyConditionExpression: `${field} = :val`,
                ExpressionAttributeValues: { ":val": value }
            }));
            return (result.Items as T[]) || [];
        } catch (err: any) {
            // GSI doesn't exist yet on DynamoDB — fall back to Scan
            if (err.name === "ValidationException" && err.message?.includes("specified index")) {
                console.warn(`[DB] GSI "${gsiName}" not found on "${tableName}", falling back to Scan`);
            } else {
                throw err; // Re-throw if it's a different error
            }
        }
    }

    // Fallback to Scan + filter (works for in-memory DB and tables without GSIs)
    const result = await docClient.send(new ScanCommand({
        TableName: tableName,
        FilterExpression: `${field} = :val`,
        ExpressionAttributeValues: { ":val": value }
    }));
    return (result.Items as T[]) || [];
}

export async function queryItems<T>(tableName: string, indexName: string, keyCondition: string, attrValues: any): Promise<T[]> {
    const result = await docClient.send(new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: attrValues
    }));
    return (result.Items as T[]) || [];
}

export async function createItem<T>(tableName: string, item: T): Promise<T> {
    await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
}

export async function updateItem(tableName: string, key: any, updateExpression: string, expressionAttributeValues: any): Promise<void> {
    await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues
    }));
}

export async function deleteItem(tableName: string, key: any): Promise<void> {
    await docClient.send(new DeleteCommand({ TableName: tableName, Key: key }));
}
