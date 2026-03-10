
export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: string;
  subjects: string[];
  level: "Beginner" | "Intermediate" | "Advanced";
  thumbnail: string;
  instructor: string;
  enrolledStudents: number;
  maxStudents: number;
}

export const dummyCourses: Course[] = [
  {
    id: 1,
    title: "Complete Mathematics Mastery",
    description: "Master all mathematical concepts from basic to advanced level including calculus, algebra, and geometry.",
    price: 4999,
    duration: "6 Months",
    subjects: ["Mathematics"],
    level: "Intermediate",
    thumbnail: "/placeholder.svg",
    instructor: "Dr. Rajesh Kumar",
    enrolledStudents: 245,
    maxStudents: 300
  },
  {
    id: 2,
    title: "Logical Reasoning & Aptitude",
    description: "Develop strong reasoning skills with comprehensive coverage of logical thinking and problem-solving.",
    price: 3999,
    duration: "4 Months",
    subjects: ["Reasoning"],
    level: "Beginner",
    thumbnail: "/placeholder.svg",
    instructor: "Prof. Priya Sharma",
    enrolledStudents: 189,
    maxStudents: 250
  },
  {
    id: 3,
    title: "Computer Science Fundamentals",
    description: "Complete computer science course covering programming, algorithms, and data structures.",
    price: 5999,
    duration: "8 Months",
    subjects: ["Computer"],
    level: "Advanced",
    thumbnail: "/placeholder.svg",
    instructor: "Er. Amit Singh",
    enrolledStudents: 156,
    maxStudents: 200
  },
  {
    id: 4,
    title: "Complete Preparation Package",
    description: "All-in-one course covering Mathematics, Reasoning, and Computer Science for comprehensive preparation.",
    price: 9999,
    duration: "12 Months",
    subjects: ["Mathematics", "Reasoning", "Computer"],
    level: "Intermediate",
    thumbnail: "/placeholder.svg",
    instructor: "Multiple Instructors",
    enrolledStudents: 312,
    maxStudents: 500
  }
];
