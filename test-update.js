const fs = require('fs');
const db = JSON.parse(fs.readFileSync('./.data.json', 'utf8'));
const users = db.Users || [];
const student = users.find(u => u.role === 'student');
console.log("Original student name:", student.name);

// Simulation of profile.ts PUT
const userId = student.id;
const user = student;
const updates = { name: "Modified Name " + Math.random() };

const updatedUser = {
    ...user,
    ...updates,
    id: user.id,
    email: user.email,
    role: user.role
};
console.log("Updated user name:", updatedUser.name);

// Simulation of db-memory.ts createItem
const pkFields = ['id', 'email', 'resultId', 'feeId', 'notificationId', 'attendanceId', 'key'];
let replaced = false;
for (const i of users) {
    let isMatch = false;
    for (const field of pkFields) {
        if (updatedUser[field] !== undefined && i[field] === updatedUser[field]) {
            isMatch = true;
            break;
        }
    }
    if (isMatch) {
        Object.assign(i, updatedUser);
        replaced = true;
        break;
    }
}
console.log("Replaced?", replaced);
const studentAfter = users.find(u => u.id === userId);
console.log("Final student name:", studentAfter.name);
