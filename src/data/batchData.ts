
export interface Batch {
  id: number;
  name: string;
  course: string;
  instructor: string;
  startDate: string;
  endDate: string;
  timing: string;
  maxStudents: number;
  enrolledStudents: string[];
  status: "Active" | "Upcoming" | "Completed";
}

export const dummyBatches: Batch[] = [
  {
    id: 1,
    name: "Morning Batch - Math Advanced",
    course: "Complete Mathematics Mastery",
    instructor: "Dr. Rajesh Kumar",
    startDate: "2024-01-15",
    endDate: "2024-07-15",
    timing: "09:00 AM - 11:00 AM",
    maxStudents: 30,
    enrolledStudents: ["student1@hcl.com", "student2@hcl.com"],
    status: "Active"
  },
  {
    id: 2,
    name: "Evening Batch - Reasoning",
    course: "Logical Reasoning & Aptitude",
    instructor: "Prof. Priya Sharma",
    startDate: "2024-02-01",
    endDate: "2024-06-01",
    timing: "06:00 PM - 08:00 PM",
    maxStudents: 25,
    enrolledStudents: ["student3@hcl.com"],
    status: "Active"
  },
  {
    id: 3,
    name: "Weekend Batch - Computer Science",
    course: "Computer Science Fundamentals",
    instructor: "Er. Amit Singh",
    startDate: "2024-03-01",
    endDate: "2024-11-01",
    timing: "10:00 AM - 02:00 PM (Weekends)",
    maxStudents: 20,
    enrolledStudents: [],
    status: "Upcoming"
  }
];
