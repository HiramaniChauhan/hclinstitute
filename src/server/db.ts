
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // Useful for local DynamoDB
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fakeMyKeyId",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fakeSecretAccessKey",
    },
});

export const docClient = DynamoDBDocumentClient.from(client);

export const TABLES = {
    USERS: process.env.DYNAMODB_USERS_TABLE || "Users",
    OTPS: "Otps",
    CONFIG: "Config",
    COURSES: "Courses",
    BATCHES: "Batches",
    ANNOUNCEMENTS: "Announcements",
    LECTURES: "Lectures",
    TESTS: "Tests",
    RESULTS: "Results",
    FORUM_POSTS: "ForumPosts",
    CHAT_MESSAGES: "ChatMessages",
    NOTES: "Notes",
    SELECTED_STUDENTS: "SelectedStudents",
    CHAPTER_TESTS: "ChapterTests",
    CHAPTER_RESULTS: "ChapterResults"
};

// Helper to initialize tables if they don't exist (optional, for demo)
// In a real app, you'd use CDK or Terraform
