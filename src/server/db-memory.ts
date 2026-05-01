import fs from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

export class InMemoryDatabase {
    private tables: Record<string, any[]> = {};
    private indices: Record<string, Record<string, Map<string, any>>> = {};
    private dataFilePath: string;
    private saveTimeout: NodeJS.Timeout | null = null;

    constructor() {
        this.dataFilePath = path.join(process.cwd(), '.data.json');
        this.loadFromFile();
    }

    private loadFromFile() {
        try {
            if (fs.existsSync(this.dataFilePath)) {
                const data = fs.readFileSync(this.dataFilePath, 'utf-8');
                this.tables = JSON.parse(data);
                this.rebuildIndices();
                console.log("[Database] Loaded data from disk and rebuilt indices");
            }
        } catch (error) {
            console.error("[Database] Error loading from disk:", error);
        }
    }

    private rebuildIndices() {
        this.indices = {};
        for (const tableName in this.tables) {
            this.indices[tableName] = {};
            const table = this.tables[tableName];
            
            // We index 'id' and 'email' as they are most commonly used for lookups
            const fieldsToIndex = ['id', 'email'];
            for (const field of fieldsToIndex) {
                this.indices[tableName][field] = new Map();
                for (const item of table) {
                    if (item[field] !== undefined) {
                        this.indices[tableName][field].set(item[field], item);
                    }
                }
            }
        }
    }

    private updateIndices(tableName: string, item: any, isDelete = false) {
        if (!this.indices[tableName]) this.indices[tableName] = {};
        
        const fieldsToIndex = ['id', 'email'];
        for (const field of fieldsToIndex) {
            if (item[field] !== undefined) {
                if (!this.indices[tableName][field]) this.indices[tableName][field] = new Map();
                
                if (isDelete) {
                    this.indices[tableName][field].delete(item[field]);
                } else {
                    this.indices[tableName][field].set(item[field], item);
                }
            }
        }
    }

    private async saveToFile() {
        try {
            // Minify JSON to save space and IO time
            await writeFile(this.dataFilePath, JSON.stringify(this.tables));
        } catch (error) {
            console.error("[Database] Error saving to disk:", error);
        }
    }

    private scheduleSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Debounce: Wait 500ms after the last activity before saving
        this.saveTimeout = setTimeout(() => {
            this.saveToFile();
            this.saveTimeout = null;
        }, 500);
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
        const pkFields = ['id', 'email', 'resultId', 'feeId', 'notificationId', 'key'];
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

        // Keep indices in sync
        this.updateIndices(tableName, item);
        this.scheduleSave();
    }

    get(tableName: string, key: any) {
        // Optimization: if searching by ID or Email, use the index
        if (this.indices[tableName]) {
            if (key.id !== undefined && this.indices[tableName].id) {
                return this.indices[tableName].id.get(key.id) || null;
            }
            if (key.email !== undefined && this.indices[tableName].email) {
                return this.indices[tableName].email.get(key.email) || null;
            }
        }

        const table = this.getTable(tableName);
        return table.find(item => this.matchKey(item, key)) || null;
    }

    // Helper for wrapper to do indexed lookup
    getByIndex(tableName: string, field: string, value: string) {
        if (this.indices[tableName] && this.indices[tableName][field]) {
            return this.indices[tableName][field].get(value) || null;
        }
        return null;
    }

    scan(tableName: string) {
        return this.getTable(tableName);
    }

    delete(tableName: string, key: any) {
        const table = this.getTable(tableName);
        const index = table.findIndex(item => this.matchKey(item, key));
        if (index !== -1) {
            const item = table[index];
            table.splice(index, 1);
            this.updateIndices(tableName, item, true);
            this.scheduleSave();
        }
    }
}

export const memoryDb = new InMemoryDatabase();
