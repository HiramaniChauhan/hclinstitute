import fs from 'fs';
import path from 'path';

export class InMemoryDatabase {
    private tables: Record<string, any[]> = {};
    private dataFilePath: string;

    constructor() {
        this.dataFilePath = path.join(process.cwd(), '.data.json');
        this.loadFromFile();
    }

    private loadFromFile() {
        try {
            if (fs.existsSync(this.dataFilePath)) {
                const data = fs.readFileSync(this.dataFilePath, 'utf-8');
                this.tables = JSON.parse(data);
                console.log("[Database] Loaded data from disk");
            }
        } catch (error) {
            console.error("[Database] Error loading from disk:", error);
        }
    }

    private saveToFile() {
        try {
            fs.writeFileSync(this.dataFilePath, JSON.stringify(this.tables, null, 2));
        } catch (error) {
            console.error("[Database] Error saving to disk:", error);
        }
    }

    private getTable(tableName: string) {
        if (!this.tables[tableName]) {
            this.tables[tableName] = [];
        }
        return this.tables[tableName];
    }

    private matchKey(item: any, key: any): boolean {
        if (!key) return false;
        return Object.keys(key).every(k => item[k] === key[k]);
    }

    put(tableName: string, item: any) {
        const table = this.getTable(tableName);

        // Primary key fields per table - only match on the true PK to decide update vs insert
        // Results intentionally use ONLY resultId as PK so multiple attempts per test are stored separately
        const pkFields = ['id', 'email', 'resultId', 'feeId', 'notificationId', 'attendanceId', 'key'];
        let replaced = false;

        for (const i of table) {
            // Check if any of the likely PK fields match
            let isMatch = false;
            for (const field of pkFields) {
                if (item[field] !== undefined && i[field] === item[field]) {
                    isMatch = true;
                    break;
                }
            }
            // Composite key for Enrollments ONLY (userId + courseId) — NOT for Results
            if (tableName === 'Enrollments' && item.userId && item.courseId && i.userId === item.userId && i.courseId === item.courseId) {
                isMatch = true;
            }

            if (isMatch) {
                Object.assign(i, item);
                replaced = true;
                break;
            }
        }

        if (!replaced) {
            table.push(item);
        }

        this.saveToFile();
    }

    get(tableName: string, key: any) {
        const table = this.getTable(tableName);
        return table.find(item => this.matchKey(item, key)) || null;
    }

    scan(tableName: string) {
        return this.getTable(tableName);
    }

    delete(tableName: string, key: any) {
        const table = this.getTable(tableName);
        const index = table.findIndex(item => this.matchKey(item, key));
        if (index !== -1) {
            table.splice(index, 1);
            this.saveToFile();
        }
    }
}

export const memoryDb = new InMemoryDatabase();
