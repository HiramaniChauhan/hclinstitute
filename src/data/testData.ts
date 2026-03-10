
export interface Question {
  id: string | number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  image?: string;
}

export interface TestSection {
  id: string;
  name: string;
  questions: Question[];
  duration: number; // in minutes
  marksPerQuestion: number;
  negativeMarks?: number;
}

export interface Test {
  id?: string | number;
  testId?: string;
  title: string;
  subject: string; // Keep for backward compatibility or general categorization
  sections: TestSection[];
  duration: number; // Total duration in minutes
  difficulty: "Easy" | "Medium" | "Hard";
  totalMarks: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

export const dummyQuestions: Record<string, Question[]> = {
  Mathematics: [
    {
      id: 1,
      question: "What is the value of 2x + 3 = 11?",
      options: ["x = 2", "x = 3", "x = 4", "x = 5"],
      correctAnswer: 2,
      explanation: "2x = 11 - 3 = 8, so x = 4"
    },
    {
      id: 2,
      question: "What is the derivative of x²?",
      options: ["x", "2x", "x²", "2x²"],
      correctAnswer: 1,
      explanation: "The derivative of x² is 2x"
    },
    {
      id: 3,
      question: "What is 15% of 200?",
      options: ["25", "30", "35", "40"],
      correctAnswer: 1,
      explanation: "15% of 200 = 0.15 × 200 = 30"
    }
  ],
  Reasoning: [
    {
      id: 4,
      question: "If CAT = 312, then DOG = ?",
      options: ["415", "426", "437", "448"],
      correctAnswer: 0,
      explanation: "C=3, A=1, T=20, so CAT = 3+1+20 = 24, but coded as 312. Similarly DOG = 4+15+7 = 26, coded as 415"
    },
    {
      id: 5,
      question: "Complete the series: 2, 6, 18, 54, ?",
      options: ["108", "162", "216", "270"],
      correctAnswer: 1,
      explanation: "Each number is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162"
    }
  ],
  Computer: [
    {
      id: 6,
      question: "Which of the following is not a programming language?",
      options: ["Python", "Java", "HTML", "C++"],
      correctAnswer: 2,
      explanation: "HTML is a markup language, not a programming language"
    },
    {
      id: 7,
      question: "What does CPU stand for?",
      options: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Computer Program Unit"],
      correctAnswer: 0,
      explanation: "CPU stands for Central Processing Unit"
    }
  ]
};

export const dummyTests: Test[] = [
  {
    id: 1,
    title: "Mathematics - Basic Algebra",
    subject: "Mathematics",
    sections: [
      {
        id: "sec_1",
        name: "Algebra",
        questions: dummyQuestions.Mathematics,
        duration: 60,
        marksPerQuestion: 10
      }
    ],
    duration: 60,
    difficulty: "Easy",
    totalMarks: 30,
    startDate: "2024-03-20",
    startTime: "10:00",
    endDate: "2024-03-25",
    endTime: "23:59"
  },
  {
    id: 2,
    title: "Reasoning - Logical Thinking",
    subject: "Reasoning",
    sections: [
      {
        id: "sec_2",
        name: "Logic",
        questions: dummyQuestions.Reasoning,
        duration: 45,
        marksPerQuestion: 10
      }
    ],
    duration: 45,
    difficulty: "Medium",
    totalMarks: 20,
    startDate: "2024-03-21",
    startTime: "09:00",
    endDate: "2024-03-26",
    endTime: "18:00"
  },
  {
    id: 3,
    title: "Computer - Fundamentals",
    subject: "Computer",
    sections: [
      {
        id: "sec_3",
        name: "Basics",
        questions: dummyQuestions.Computer,
        duration: 30,
        marksPerQuestion: 10
      }
    ],
    duration: 30,
    difficulty: "Easy",
    totalMarks: 20,
    startDate: "2024-03-22",
    startTime: "14:00",
    endDate: "2024-03-27",
    endTime: "20:00"
  }
];


