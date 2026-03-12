import { GetCommand, PutCommand, ScanCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../db-wrapper";

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
    const result = await docClient.send(new ScanCommand(params));
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
