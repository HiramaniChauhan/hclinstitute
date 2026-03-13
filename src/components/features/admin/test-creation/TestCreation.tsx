
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge"; import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Clock, Users, Calendar, Target, Award, Edit, Trash2, Image as ImageIcon, X, Copy, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Test, Question, TestSection } from "@/data/testData";
import { useEffect } from "react";
import { Latex } from "@/components/ui/latex";



export const TestCreation = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [viewingTestQuestions, setViewingTestQuestions] = useState<Test | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [statsFilter, setStatsFilter] = useState<'all' | 'active' | 'completed' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const resp = await fetch("/api/tests", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await resp.json();
      if (Array.isArray(data)) {
        // Sort by scheduled date
        const sorted = data.sort((a, b) => {
          const dateA = a.startDate ? new Date(`${a.startDate}T${a.startTime || '00:00'}`) : new Date(0);
          const dateB = b.startDate ? new Date(`${b.startDate}T${b.startTime || '00:00'}`) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        setTests(sorted);
      }
    } catch (error) {
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  // Main Form Data for Test
  const [testFormData, setTestFormData] = useState({
    title: "",
    duration: "",
    difficulty: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    sections: [] as TestSection[]
  });

  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [sectionFormData, setSectionFormData] = useState({
    name: "",
    duration: "",
    marksPerQuestion: "",
    negativeMarks: "0"
  });



  // Inline Question Form Data
  const [questionFormData, setQuestionFormData] = useState({
    text: "",
    image: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "",
    explanation: ""
  });

  const handleCreateOpen = () => {
    setEditingTest(null);
    setTestFormData({
      title: "",
      duration: "",
      difficulty: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      sections: []
    });
    setActiveSectionId("");
    setEditingSectionId(null);
    setSectionFormData({ name: "", duration: "", marksPerQuestion: "", negativeMarks: "0" });
    setOpen(true);
  };

  const handleEditTest = (test: Test, rescheduleFlag = false) => {
    setEditingTest(test);
    setIsRescheduling(rescheduleFlag);
    setTestFormData({
      title: test.title,
      duration: test.duration.toString(),
      difficulty: test.difficulty,
      startDate: test.startDate || "",
      startTime: test.startTime || "",
      endDate: test.endDate || "",
      endTime: test.endTime || "",
      sections: test.sections || []
    });
    if (test.sections && test.sections.length > 0) {
      setActiveSectionId(test.sections[0].id);
    }
    setEditingSectionId(null);
    setSectionFormData({ name: "", duration: "", marksPerQuestion: "", negativeMarks: "0" });
    setOpen(true);
  };

  const handleEditSectionStart = (section: TestSection) => {
    setEditingSectionId(section.id);
    setSectionFormData({
      name: section.name,
      duration: section.duration.toString(),
      marksPerQuestion: section.marksPerQuestion.toString(),
      negativeMarks: (section.negativeMarks || 0).toString()
    });
  };

  const handleAddSection = () => {
    if (!sectionFormData.name || !sectionFormData.duration || !sectionFormData.marksPerQuestion) return;

    if (editingSectionId) {
      // Update existing section
      setTestFormData(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === editingSectionId
            ? {
              ...s,
              name: sectionFormData.name,
              duration: parseInt(sectionFormData.duration),
              marksPerQuestion: parseFloat(sectionFormData.marksPerQuestion),
              negativeMarks: parseFloat(sectionFormData.negativeMarks) || 0
            }
            : s
        )
      }));
      setEditingSectionId(null);
      toast.success("Section updated");
    } else {
      // Add new section
      const newSection: TestSection = {
        id: `sec_${Date.now()}`,
        name: sectionFormData.name,
        duration: parseInt(sectionFormData.duration),
        marksPerQuestion: parseFloat(sectionFormData.marksPerQuestion),
        negativeMarks: parseFloat(sectionFormData.negativeMarks) || 0,
        questions: []
      };

      setTestFormData(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
      setActiveSectionId(newSection.id);
      toast.success("Section added");
    }
    setSectionFormData({ name: "", duration: "", marksPerQuestion: "", negativeMarks: "0" });
  };

  const handleDeleteSection = (sectionId: string) => {
    const sectionName = testFormData.sections.find(s => s.id === sectionId)?.name || 'this section';
    if (!confirm(`Are you sure you want to delete "${sectionName}"? This will remove all questions in this section.`)) return;
    setTestFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
    if (activeSectionId === sectionId) {
      const remaining = testFormData.sections.filter(s => s.id !== sectionId);
      setActiveSectionId(remaining.length > 0 ? remaining[0].id : "");
    }
    if (editingSectionId === sectionId) setEditingSectionId(null);
  };

  const handleAddQuestionToTest = () => {
    if (!activeSectionId) {
      alert("Please add/select a section first");
      return;
    }

    const options = [
      questionFormData.optionA,
      questionFormData.optionB,
      questionFormData.optionC,
      questionFormData.optionD
    ];
    const correctMap: Record<string, number> = { "A": 0, "B": 1, "C": 2, "D": 3 };

    if (editingQuestion) {
      // Update existing question
      setTestFormData(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === activeSectionId
            ? {
              ...s,
              questions: s.questions.map(q =>
                q.id === editingQuestion.id
                  ? {
                    ...q,
                    question: questionFormData.text,
                    image: questionFormData.image,
                    options: options,
                    correctAnswer: correctMap[questionFormData.correctOption] ?? 0,
                    explanation: questionFormData.explanation
                  }
                  : q
              )
            }
            : s
        )
      }));
      setEditingQuestion(null);
      toast.success("Question updated", { duration: 1500 });
    } else {
      // Add new question
      const newQuestion: Question = {
        id: Date.now(),
        question: questionFormData.text,
        image: questionFormData.image,
        options: options,
        correctAnswer: correctMap[questionFormData.correctOption] ?? 0,
        explanation: questionFormData.explanation
      };

      setTestFormData(prev => ({
        ...prev,
        sections: prev.sections.map(s =>
          s.id === activeSectionId
            ? { ...s, questions: [...s.questions, newQuestion] }
            : s
        )
      }));
      toast.success("Question added to section", { duration: 1500 });
    }

    // Reset question form
    setQuestionFormData({
      text: "", image: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "", explanation: ""
    });
  };

  const handleViewQuestions = (test: Test) => {
    setViewingTestQuestions(test);
    setQuestionDialogOpen(true);
    setIsAddingQuestion(false);
    setEditingQuestion(null);
  };

  const handleEditQuestion = (question: Question, sectionId?: string) => {
    if (sectionId) setActiveSectionId(sectionId);
    setEditingQuestion(question);
    const optionLabels = ["A", "B", "C", "D"];
    setQuestionFormData({
      text: question.question,
      image: question.image || "",
      optionA: question.options[0] || "",
      optionB: question.options[1] || "",
      optionC: question.options[2] || "",
      optionD: question.options[3] || "",
      correctOption: optionLabels[question.correctAnswer] || "A",
      explanation: question.explanation || ""
    });
    // Scroll to form if in dialog
    const formElement = document.getElementById('question-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (questionId: string | number, sectionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;
    // 1. Update the main form data (for when editing the full test)
    const updatedSectionsForm = testFormData.sections.map(s =>
      s.id === sectionId
        ? { ...s, questions: s.questions.filter(q => q.id !== questionId) }
        : s
    );

    setTestFormData(prev => ({
      ...prev,
      sections: updatedSectionsForm
    }));

    // 2. If we are in the standalone "Questions" dialog, save it to backend immediately
    if (viewingTestQuestions) {
      const updatedSectionsView = viewingTestQuestions.sections.map(s =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter(q => q.id !== questionId) }
          : s
      );

      const testToSave = {
        ...viewingTestQuestions,
        sections: updatedSectionsView,
        totalQuestions: updatedSectionsView.reduce((acc, s) => acc + s.questions.length, 0),
        totalMarks: updatedSectionsView.reduce((acc, s) => acc + (s.questions.length * s.marksPerQuestion), 0)
      };

      try {
        const token = sessionStorage.getItem('token');
        const resp = await fetch(`/api/tests/${viewingTestQuestions.testId || viewingTestQuestions.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(testToSave)
        });

        if (resp.ok) {
          toast.success("Question deleted");
          setViewingTestQuestions(testToSave);
          fetchTests();
        } else {
          toast.error("Failed to delete question from server");
        }
      } catch (error) {
        toast.error("Network error while deleting question");
      }
    } else {
      // If we are just building the test initially, a generic toast is enough
      toast.success("Question deleted locally. Please click Save as Draft or Update to persist.");
    }
  };

  const handleSaveTest = async () => {
    try {
      const isActuallyRescheduling = !!(editingTest && isRescheduling);
      const method = (editingTest && !isActuallyRescheduling) ? "PATCH" : "POST";
      const oldTestId = isActuallyRescheduling ? (editingTest.testId || editingTest.id) : null;
      let url = (editingTest && !isActuallyRescheduling) ? `/api/tests/${editingTest.testId || editingTest.id}` : "/api/tests";

      const token = sessionStorage.getItem('token');

      const testToSave = {
        ...testFormData,
        duration: parseInt(testFormData.duration) || 0,
        totalQuestions: testFormData.sections.reduce((acc, s) => acc + s.questions.length, 0),
        totalMarks: testFormData.sections.reduce((acc, s) => acc + (s.questions.length * s.marksPerQuestion), 0),
        courseId: "default-course",
        subject: "General"
      };

      console.log(`[TestCreation] Saving Test:
        Method: ${method}
        URL: ${url}
        Rescheduling: ${isActuallyRescheduling}
      `);

      const resp = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(testToSave)
      });

      if (resp.ok) {
        toast.success(isActuallyRescheduling ? "Test rescheduled successfully (New Copy created)!" : (editingTest ? "Test updated" : "Test created"));

        if (isActuallyRescheduling && oldTestId) {
          console.log(`[TestCreation] Deleting old test ${oldTestId} after reschedule.`);
          await handleDeleteTest(oldTestId, true);
        }

        setOpen(false);
        fetchTests();
      } else {
        const errText = await resp.text();
        console.error("[TestCreation] Save Failed:", errText);
        try {
          const err = JSON.parse(errText);
          toast.error(err.error || "Failed to save test");
        } catch {
          toast.error("Failed to save test: " + errText);
        }
      }
    } catch (error) {
      toast.error("Network error while saving test");
    }
  };

  const handleDeleteTest = async (testId: string | number, silent = false) => {
    if (!silent && !confirm("Are you sure you want to delete this test?")) return;
    try {
      const token = sessionStorage.getItem('token');
      const resp = await fetch(`/api/tests/${testId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (resp.ok) {
        toast.success("Test deleted");
        fetchTests();
      } else {
        const err = await resp.json();
        toast.error(err.error || "Failed to delete test");
      }
    } catch (error) {
      toast.error("Network error while deleting test");
    }
  };

  const handleSaveAsNewTest = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const testToSave = {
        ...testFormData,
        title: testFormData.title.includes(" (Copy)") ? testFormData.title : `${testFormData.title} (Copy)`,
        duration: parseInt(testFormData.duration) || 0,
        totalQuestions: testFormData.sections.reduce((acc, s) => acc + s.questions.length, 0),
        totalMarks: testFormData.sections.reduce((acc, s) => acc + (s.questions.length * s.marksPerQuestion), 0),
        courseId: "default-course",
        subject: "General"
      };

      const resp = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(testToSave)
      });

      if (resp.ok) {
        toast.success("Duplicated as new test");
        setOpen(false);
        fetchTests();
      } else {
        const err = await resp.json();
        toast.error(err.error || "Failed to duplicate test");
      }
    } catch (error) {
      toast.error("Network error while duplicating test");
    }
  };

  const handleSaveQuestionChange = async () => {
    if (!viewingTestQuestions) return;

    // Verify which section we are adding to (default to first if not active)
    const targetSectionId = activeSectionId || viewingTestQuestions.sections[0]?.id;

    if (!targetSectionId) {
      toast.error("No section available to add question to.");
      return;
    }

    const correctMap: Record<string, number> = { "A": 0, "B": 1, "C": 2, "D": 3 };
    const options = [
      questionFormData.optionA,
      questionFormData.optionB,
      questionFormData.optionC,
      questionFormData.optionD
    ];

    let updatedSections = [...viewingTestQuestions.sections];

    if (editingQuestion) {
      // Update existing question
      updatedSections = updatedSections.map(s =>
        s.id === targetSectionId
          ? {
            ...s,
            questions: s.questions.map(q =>
              q.id === editingQuestion.id
                ? {
                  ...q,
                  question: questionFormData.text,
                  image: questionFormData.image,
                  options: options,
                  correctAnswer: correctMap[questionFormData.correctOption] ?? 0,
                  explanation: questionFormData.explanation
                }
                : q
            )
          }
          : s
      );
    } else {
      // Add new question
      const newQuestion: Question = {
        id: Date.now(),
        question: questionFormData.text,
        image: questionFormData.image,
        options: options,
        correctAnswer: correctMap[questionFormData.correctOption] ?? 0,
        explanation: questionFormData.explanation
      };

      updatedSections = updatedSections.map(s =>
        s.id === targetSectionId
          ? { ...s, questions: [...s.questions, newQuestion] }
          : s
      );
    }

    const testToSave = {
      ...viewingTestQuestions,
      sections: updatedSections,
      totalQuestions: updatedSections.reduce((acc, s) => acc + s.questions.length, 0),
      totalMarks: updatedSections.reduce((acc, s) => acc + (s.questions.length * s.marksPerQuestion), 0),
      courseId: "default-course",
      subject: "General"
    };

    try {
      const token = sessionStorage.getItem('token');
      const resp = await fetch(`/api/tests/${viewingTestQuestions.testId || viewingTestQuestions.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(testToSave)
      });

      if (resp.ok) {
        toast.success(editingQuestion ? "Question updated" : "Question added");
        setIsAddingQuestion(false);
        setEditingQuestion(null);
        // Refresh local view data so the dialog updates
        setViewingTestQuestions(testToSave);
        // Refresh global test list
        fetchTests();
      } else {
        const err = await resp.json();
        toast.error(err.error || "Failed to update question");
      }
    } catch (error) {
      toast.error("Network error while saving question");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Test Creation & Management</h1>

        {/* Create/Edit Test Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateOpen}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTest ? "Edit Test" : "Create New Test with Questions"}</DialogTitle>
              <DialogDescription>
                {editingTest ? "Update the test details and settings." : "Create comprehensive tests with multiple choice questions"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Name</Label>
                  <Input
                    value={testFormData.title}
                    onChange={(e) => setTestFormData({ ...testFormData, title: e.target.value })}
                    placeholder="Enter test name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Duration (minutes)</Label>
                  <Input type="number"
                    value={testFormData.duration}
                    onChange={(e) => setTestFormData({ ...testFormData, duration: e.target.value })}
                    placeholder="Sum of all sections"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={testFormData.difficulty} onValueChange={(val) => setTestFormData({ ...testFormData, difficulty: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scheduling Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={testFormData.startDate} onChange={(e) => setTestFormData({ ...testFormData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={testFormData.startTime} onChange={(e) => setTestFormData({ ...testFormData, startTime: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={testFormData.endDate} onChange={(e) => setTestFormData({ ...testFormData, endDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={testFormData.endTime} onChange={(e) => setTestFormData({ ...testFormData, endTime: e.target.value })} />
                </div>
              </div>

              {/* Sections Management Section */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Test Sections</h3>
                  <Badge variant="outline">{testFormData.sections.length} Sections Defined</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-lg border">
                  <div className="space-y-1">
                    <Label className="text-xs">Section Name</Label>
                    <Input
                      placeholder="e.g. Mathematics"
                      value={sectionFormData.name}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration (min)</Label>
                    <Input
                      type="number"
                      placeholder="e.min 30"
                      value={sectionFormData.duration}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, duration: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Marks per Q</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 4 or 1.5"
                      value={sectionFormData.marksPerQuestion}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, marksPerQuestion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-red-600">Negative Marks</Label>
                    <Input
                      type="number"
                      step="0.25"
                      placeholder="e.g. 1"
                      value={sectionFormData.negativeMarks}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, negativeMarks: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    {editingSectionId && (
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingSectionId(null);
                        setSectionFormData({ name: "", duration: "", marksPerQuestion: "", negativeMarks: "0" });
                      }} className="h-10">
                        Cancel
                      </Button>
                    )}
                    <Button onClick={handleAddSection} className="flex-1 h-10 bg-slate-700 hover:bg-slate-800">
                      {editingSectionId ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      {editingSectionId ? "Update" : "Add"}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {testFormData.sections.map((section) => (
                    <div
                      key={section.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${activeSectionId === section.id
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-white border-gray-200 hover:border-blue-400'
                        }`}
                      onClick={() => setActiveSectionId(section.id)}
                    >
                      <span className="text-sm font-medium">{section.name}</span>
                      <Badge variant="secondary" className="px-1 text-[10px] h-4">
                        {section.questions.length} Q
                      </Badge>
                      <div className="flex items-center gap-1 border-l pl-2 ml-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditSectionStart(section); }}
                          className="hover:text-blue-300 p-0.5"
                          title="Edit Section Details"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                          className="hover:text-red-400 p-0.5"
                          title="Delete Section"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrated Add Questions Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Add Questions to: <span className="text-blue-600">{testFormData.sections.find(s => s.id === activeSectionId)?.name || 'Select Section'}</span>
                  </h3>
                  <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-100 text-blue-800">
                    Questions in this Section: {testFormData.sections.find(s => s.id === activeSectionId)?.questions.length || 0}
                  </Badge>
                </div>

                <div id="question-form" className="space-y-4 border p-4 rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label>{editingQuestion ? "Edit Question Text" : "Question Text"}</Label>
                    <Textarea
                      value={questionFormData.text}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                      placeholder="Enter your question here... (Use $...$ for inline and $$...$$ for block LaTeX)"
                      className="min-h-[120px]"
                    />
                  </div>

                  {questionFormData.text && (
                    <div className="space-y-2">
                      <Label className="text-blue-600 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Live LaTeX Preview
                      </Label>
                      <div className="p-4 rounded-lg bg-white border border-blue-100 min-h-[60px] text-lg">
                        <Latex content={questionFormData.text} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Question Image (Optional)
                    </Label>
                    <div className="flex gap-4 items-center">
                      <Input
                        type="file"
                        accept="image/*"
                        className="cursor-pointer bg-white flex-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setQuestionFormData({ ...questionFormData, image: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {questionFormData.image && (
                        <div className="relative shrink-0">
                          <img src={questionFormData.image} alt="Preview" className="h-10 w-10 object-cover rounded border border-slate-200" />
                          <button
                            onClick={() => setQuestionFormData({ ...questionFormData, image: "" })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Option A</Label>
                      <Input value={questionFormData.optionA} onChange={(e) => setQuestionFormData({ ...questionFormData, optionA: e.target.value })} placeholder="Option A" className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label>Option B</Label>
                      <Input value={questionFormData.optionB} onChange={(e) => setQuestionFormData({ ...questionFormData, optionB: e.target.value })} placeholder="Option B" className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label>Option C</Label>
                      <Input value={questionFormData.optionC} onChange={(e) => setQuestionFormData({ ...questionFormData, optionC: e.target.value })} placeholder="Option C" className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label>Option D</Label>
                      <Input value={questionFormData.optionD} onChange={(e) => setQuestionFormData({ ...questionFormData, optionD: e.target.value })} placeholder="Option D" className="bg-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select value={questionFormData.correctOption} onValueChange={(val) => setQuestionFormData({ ...questionFormData, correctOption: val })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select correct option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Option A</SelectItem>
                        <SelectItem value="B">Option B</SelectItem>
                        <SelectItem value="C">Option C</SelectItem>
                        <SelectItem value="D">Option D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      value={questionFormData.explanation}
                      onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                      placeholder="Explain the correct answer..."
                      className="bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    {editingQuestion && (
                      <Button variant="outline" onClick={() => {
                        setEditingQuestion(null);
                        setQuestionFormData({
                          text: "", image: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "", explanation: ""
                        });
                      }}>
                        Cancel Edit
                      </Button>
                    )}
                    <Button onClick={handleAddQuestionToTest} className="mt-2 bg-slate-800 hover:bg-slate-900">
                      <Plus className="w-4 h-4 mr-2" />
                      {editingQuestion ? "Update Question" : "Add This Question"}
                    </Button>
                  </div>
                </div>

                {/* Inline Question List */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Added Questions in {testFormData.sections.find(s => s.id === activeSectionId)?.name}
                  </h4>
                  <div className="space-y-3">
                    {testFormData.sections.find(s => s.id === activeSectionId)?.questions.length === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg text-gray-400 text-sm">
                        No questions added to this section yet.
                      </div>
                    ) : (
                      testFormData.sections.find(s => s.id === activeSectionId)?.questions.map((q, i) => (
                        <Card key={q.id || i} className={`overflow-hidden border-l-4 transition-all ${editingQuestion?.id === q.id ? 'border-l-blue-600 bg-blue-50/30' : 'border-l-gray-200'}`}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1"><span className="text-gray-400 mr-2">{i + 1}.</span>{q.question}</p>
                                <div className="flex flex-wrap gap-2">
                                  {q.options.map((opt, idx) => (
                                    <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border ${q.correctAnswer === idx ? 'bg-green-100 border-green-200 text-green-700 font-bold' : 'bg-gray-50 text-gray-500'}`}>
                                      {String.fromCharCode(65 + idx)}. {opt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => handleEditQuestion(q)}>
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => activeSectionId && handleDeleteQuestion(q.id, activeSectionId)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="secondary" onClick={handleSaveTest}>Save as Draft</Button>
              {editingTest && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAsNewTest}>
                  <Copy className="w-4 h-4 mr-2" />
                  Save as New Test
                </Button>
              )}
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveTest}>
                <Target className="w-4 h-4 mr-2" />
                {editingTest ? "Update Test" : "Create Test"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View/Manage Questions Dialog */}
        <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>
                    {isAddingQuestion
                      ? (editingQuestion ? "Edit Question" : "Add Question")
                      : `Questions for: ${viewingTestQuestions?.title}`}
                  </span>
                  {!isAddingQuestion && viewingTestQuestions && (
                    <Badge variant="secondary" className="text-sm">
                      Total: {viewingTestQuestions.sections.reduce((acc, s) => acc + s.questions.length, 0)} Questions
                    </Badge>
                  )}
                </div>
                {!isAddingQuestion && (
                  <Button size="sm" onClick={() => {
                    setEditingQuestion(null);
                    setQuestionFormData({
                      text: "", image: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "", explanation: ""
                    });
                    setIsAddingQuestion(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Question
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>

            {isAddingQuestion ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    value={questionFormData.text}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                    placeholder="Enter your question here..."
                  />
                </div>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Question Image (Optional)
                  </Label>
                  <div className="flex gap-4 items-center">
                    <Input
                      type="file"
                      accept="image/*"
                      className="cursor-pointer flex-1"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setQuestionFormData({ ...questionFormData, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {questionFormData.image && (
                      <div className="relative shrink-0">
                        <img src={questionFormData.image} alt="Preview" className="h-10 w-10 object-cover rounded border border-slate-200" />
                        <button
                          onClick={() => setQuestionFormData({ ...questionFormData, image: "" })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Option A</Label>
                    <Input value={questionFormData.optionA} onChange={(e) => setQuestionFormData({ ...questionFormData, optionA: e.target.value })} placeholder="Option A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Option B</Label>
                    <Input value={questionFormData.optionB} onChange={(e) => setQuestionFormData({ ...questionFormData, optionB: e.target.value })} placeholder="Option B" />
                  </div>
                  <div className="space-y-2">
                    <Label>Option C</Label>
                    <Input value={questionFormData.optionC} onChange={(e) => setQuestionFormData({ ...questionFormData, optionC: e.target.value })} placeholder="Option C" />
                  </div>
                  <div className="space-y-2">
                    <Label>Option D</Label>
                    <Input value={questionFormData.optionD} onChange={(e) => setQuestionFormData({ ...questionFormData, optionD: e.target.value })} placeholder="Option D" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select value={questionFormData.correctOption} onValueChange={(val) => setQuestionFormData({ ...questionFormData, correctOption: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Option A</SelectItem>
                      <SelectItem value="B">Option B</SelectItem>
                      <SelectItem value="C">Option C</SelectItem>
                      <SelectItem value="D">Option D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea value={questionFormData.explanation} onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })} placeholder="Explain the correct answer..." />
                </div>
                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>Cancel</Button>
                  <Button onClick={handleSaveQuestionChange}>{editingQuestion ? "Update Question" : "Add Question"}</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {(!viewingTestQuestions?.sections || viewingTestQuestions.sections.reduce((acc, s) => acc + s.questions.length, 0) === 0) ? (
                  <p className="text-center text-gray-500 py-4">No questions added yet.</p>
                ) : (
                  viewingTestQuestions.sections.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <div className="flex items-center gap-2 border-b pb-1">
                        <h4 className="font-semibold text-blue-600">{section.name}</h4>
                        <Badge variant="outline" className="text-[10px]">{section.questions.length} Qs</Badge>
                      </div>
                      <div className="space-y-3">
                        {section.questions.map((q: Question, i: number) => (
                          <Card key={q.id || i} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="font-medium mb-2"><span className="font-bold text-gray-500 mr-2">Q{i + 1}.</span>{q.question}</p>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 pl-6">
                                    {q.options.map((opt: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${q.correctAnswer === idx ? 'bg-green-100 border-green-500 text-green-700 font-bold' : ''}`}>
                                          {String.fromCharCode(65 + idx)}
                                        </span>
                                        {opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setActiveSectionId(section.id); handleEditQuestion(q); }}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteQuestion(q.id, section.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>



      {/* Existing Tests Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Existing Tests</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading tests...</div>
            ) : tests.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No tests available. Create one to get started.</div>
            ) : (
              // Filter tests then map
              tests
                .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((test) => {
                  const testId = test.testId || test.id;
                  const isScheduled = test.startDate && test.startTime && test.endDate && test.endTime;
                  const isEnded = isScheduled && new Date(`${test.endDate}T${test.endTime}`) < new Date();

                  return (
                    <div key={testId} className={`p-4 border rounded-lg transition-all ${isEnded ? 'bg-gray-50 border-gray-200' : 'bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{test.title}</h3>
                            {isEnded && <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Completed/Ended</Badge>}
                            {!isEnded && isScheduled && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active/Scheduled</Badge>}
                            {!isScheduled && <Badge variant="outline" className="text-gray-400">Draft/No Schedule</Badge>}
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Target size={14} />
                              {test.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {test.duration} minutes
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {test.sections.length} sections
                            </span>
                          </div>

                          {isScheduled && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 font-medium">
                              <Calendar size={12} />
                              <span>{test.startDate} {test.startTime} to {test.endDate} {test.endTime}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="secondary">{test.subject}</Badge>
                            <div className="flex gap-1">
                              {test.sections.map(s => (
                                <Badge key={s.id} variant="outline" className="text-[10px] px-1 py-0">{s.name}</Badge>
                              ))}
                            </div>
                            <Badge variant={test.difficulty === 'Easy' ? 'default' : test.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                              {test.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditTest(test)}>
                              <Edit size={14} className="mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => testId && handleDeleteTest(testId)}>
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleViewQuestions(test)}>
                              <FileText size={14} className="mr-1" />
                              Questions
                            </Button>
                            {isEnded && (
                              <Button variant="secondary" size="sm" className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" onClick={() => handleEditTest(test, true)}>
                                <Calendar size={14} className="mr-1" />
                                Reschedule
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  // Map closing tags
                })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Total Tests */}
              <button
                className={`w-full flex justify-between items-center p-2 rounded-lg border transition-colors hover:bg-blue-50 ${statsFilter === 'all' ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}`}
                onClick={() => setStatsFilter(prev => prev === 'all' ? null : 'all')}
              >
                <span className="font-medium text-gray-700">Total Tests</span>
                <span className={`font-bold text-lg ${statsFilter === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>{tests.length}</span>
              </button>

              {/* Active Tests */}
              <button
                className={`w-full flex justify-between items-center p-2 rounded-lg border transition-colors hover:bg-green-50 ${statsFilter === 'active' ? 'bg-green-50 border-green-400' : 'border-gray-200'}`}
                onClick={() => setStatsFilter(prev => prev === 'active' ? null : 'active')}
              >
                <span className="font-medium text-gray-700">Active Tests</span>
                <span className={`font-bold text-lg ${statsFilter === 'active' ? 'text-green-600' : 'text-gray-800'}`}>
                  {tests.filter(t => t.startDate && new Date(`${t.endDate}T${t.endTime}`) >= new Date()).length}
                </span>
              </button>

              {/* Completed Tests */}
              <button
                className={`w-full flex justify-between items-center p-2 rounded-lg border transition-colors hover:bg-slate-50 ${statsFilter === 'completed' ? 'bg-slate-100 border-slate-400' : 'border-gray-200'}`}
                onClick={() => setStatsFilter(prev => prev === 'completed' ? null : 'completed')}
              >
                <span className="font-medium text-gray-700">Completed Tests</span>
                <span className={`font-bold text-lg ${statsFilter === 'completed' ? 'text-slate-600' : 'text-blue-600'}`}>
                  {tests.filter(t => t.startDate && new Date(`${t.endDate}T${t.endTime}`) < new Date()).length}
                </span>
              </button>

              {/* Filtered list */}
              {statsFilter && (() => {
                const now = new Date();
                const currentFilter = statsFilter;
                const filtered = tests.filter(t => {
                  if (currentFilter === 'all') return true;
                  if (!t.startDate) return false;
                  const end = new Date(`${t.endDate}T${t.endTime || '23:59'}`);
                  return currentFilter === 'active' ? end >= now : end < now;
                });
                return (
                  <div className="mt-3 border-t pt-3 space-y-2 max-h-60 overflow-y-auto">
                    <p className="text-xs font-bold uppercase text-gray-400 mb-2">
                      {statsFilter === 'all' ? 'All Tests' : statsFilter === 'active' ? 'Active Tests' : 'Completed Tests'} ({filtered.length})
                    </p>
                    {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-2">No tests</p>}
                    {filtered.map(t => (
                      <div key={String(t.testId || t.id)} className="flex items-start justify-between p-2 bg-white border rounded-lg text-sm gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{t.title}</p>
                          <p className="text-xs text-gray-500">{t.subject} • {t.sections.reduce((a, s) => a + s.questions.length, 0)}Q • {t.duration}m</p>
                          {t.startDate && <p className="text-xs text-blue-600">{t.startDate} → {t.endDate}</p>}
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${!t.endDate || new Date(`${t.endDate}T${t.endTime || '23:59'}`) >= new Date()
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {!t.endDate || new Date(`${t.endDate}T${t.endTime || '23:59'}`) >= new Date() ? 'Active' : 'Ended'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tests.slice(0, 4).map((test, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  {test.title}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
