import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Save, Target, Clock, FileText, X, Image as ImageIcon, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Question, TestSection } from "@/data/testData";

interface ChapterTestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chapterId: string | number;
    chapterName: string;
    testId?: string | null;
    onSaveSuccess?: (testMeta: { id: string, title: string, duration: number, totalQuestions: number }) => void;
}

export const ChapterTestModal = ({ open, onOpenChange, chapterId, chapterName, testId, onSaveSuccess }: ChapterTestModalProps) => {
    const [loading, setLoading] = useState(false);
    const [testData, setTestData] = useState<any>({
        id: "",
        title: `Practice: ${chapterName}`,
        duration: 30,
        sections: [] as TestSection[]
    });

    const [activeSectionId, setActiveSectionId] = useState<string>("");
    const [sectionForm, setSectionForm] = useState({ name: "", duration: "", marksPerQuestion: "1", negativeMarks: "0" });
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

    const [questionForm, setQuestionForm] = useState({
        text: "", image: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: ""
    });
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

    useEffect(() => {
        if (open && chapterId) {
            if (testId) {
                fetchExistingTest();
            } else {
                // Reset to blank for a new test
                setTestData({
                    id: `ctest_${Date.now()}`,
                    title: `Practice: ${chapterName}`,
                    duration: 30,
                    sections: [] as TestSection[]
                });
                setActiveSectionId("");
                setSectionForm({ name: "", duration: "", marksPerQuestion: "1", negativeMarks: "0" });
                setQuestionForm({ text: "", image: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "" });
            }
        }
    }, [open, chapterId, testId]);

    const fetchExistingTest = async () => {
        if (!testId) return;
        setLoading(true);
        try {
            const resp = await fetch(`/api/chapter-tests/test/${testId}`);
            if (resp.ok) {
                const data = await resp.json();
                setTestData(data);
                if (data.sections.length > 0) setActiveSectionId(data.sections[0].id);
            }
        } catch (err) {
            console.error("No existing test found or fetch failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSection = () => {
        if (!sectionForm.name) return;

        if (editingSectionId) {
            setTestData((prev: any) => ({
                ...prev,
                sections: prev.sections.map((s: any) => s.id === editingSectionId ? {
                    ...s,
                    name: sectionForm.name,
                    duration: parseInt(sectionForm.duration) || 30,
                    marksPerQuestion: parseFloat(sectionForm.marksPerQuestion) || 1,
                    negativeMarks: parseFloat(sectionForm.negativeMarks) || 0
                } : s)
            }));
            setEditingSectionId(null);
            toast.success("Section updated");
        } else {
            const newSection: TestSection = {
                id: `sec_${Date.now()}`,
                name: sectionForm.name,
                duration: parseInt(sectionForm.duration) || 30,
                marksPerQuestion: parseFloat(sectionForm.marksPerQuestion) || 1,
                negativeMarks: parseFloat(sectionForm.negativeMarks) || 0,
                questions: []
            };
            setTestData((prev: any) => ({ ...prev, sections: [...prev.sections, newSection] }));
            setActiveSectionId(newSection.id);
            toast.success("Section added");
        }
        setSectionForm({ name: "", duration: "", marksPerQuestion: "1", negativeMarks: "0" });
    };

    const handleEditSectionStart = (section: TestSection) => {
        setEditingSectionId(section.id);
        setSectionForm({
            name: section.name,
            duration: section.duration.toString(),
            marksPerQuestion: section.marksPerQuestion.toString(),
            negativeMarks: (section.negativeMarks || 0).toString()
        });
    };

    const handleAddQuestion = () => {
        if (!activeSectionId || !questionForm.text) {
            toast.error("Please select a section and enter question text");
            return;
        }

        const options = [questionForm.optionA, questionForm.optionB, questionForm.optionC, questionForm.optionD];
        const correctMap: Record<string, number> = { "A": 0, "B": 1, "C": 2, "D": 3 };

        if (editingQuestionId) {
            setTestData((prev: any) => ({
                ...prev,
                sections: prev.sections.map((s: any) => s.id === activeSectionId ? {
                    ...s,
                    questions: s.questions.map((q: any) => q.id === editingQuestionId ? {
                        ...q,
                        question: questionForm.text,
                        image: questionForm.image,
                        options,
                        correctAnswer: correctMap[questionForm.correctOption],
                        explanation: questionForm.explanation
                    } : q)
                } : s)
            }));
            setEditingQuestionId(null);
            toast.success("Question updated");
        } else {
            const newQuestion: Question = {
                id: Date.now(),
                question: questionForm.text,
                image: questionForm.image,
                options,
                correctAnswer: correctMap[questionForm.correctOption],
                explanation: questionForm.explanation
            };
            setTestData((prev: any) => ({
                ...prev,
                sections: prev.sections.map((s: any) => s.id === activeSectionId ? {
                    ...s,
                    questions: [...s.questions, newQuestion]
                } : s)
            }));
            toast.success("Question added");
        }
        setQuestionForm({ text: "", image: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "" });
    };

    const handleSaveTest = async () => {
        if (!testData.title || testData.sections.length === 0) {
            toast.error("Please enter a title and add at least one section");
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const resp = await fetch("/api/chapter-tests", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ ...testData, chapterId })
            });

            if (resp.ok) {
                toast.success("Chapter test saved successfully");

                // Calculate total questions for quick display in UI
                const totalQuestions = testData.sections.reduce((acc: number, sec: any) => acc + (sec.questions?.length || 0), 0);

                if (onSaveSuccess) {
                    onSaveSuccess({
                        id: testData.id,
                        title: testData.title,
                        duration: testData.duration || 30,
                        totalQuestions: totalQuestions
                    });
                }

                onOpenChange(false);
            } else {
                toast.error("Failed to save test");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto rounded-3xl border-none shadow-2xl p-0">
                <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <Badge className="bg-blue-500/20 text-blue-200 border-none mb-4 px-3 py-1 font-bold">CHAPTER PRACTICE BUILDER</Badge>
                        <DialogTitle className="text-4xl font-black tracking-tight mb-2">Manage Chapter Test</DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium text-lg leading-relaxed max-w-2xl">
                            Build a comprehensive practice test for <span className="text-white font-bold underline underline-offset-4 decoration-blue-500">"{chapterName}"</span>. These tests allow unlimited attempts for students.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-10">
                    {/* Basic Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="space-y-3">
                            <Label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Practice Test Title</Label>
                            <Input
                                placeholder="e.g. Mastery Quiz: Cell Bio"
                                value={testData.title}
                                onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                                className="h-14 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-black text-slate-700 uppercase tracking-widest pl-1">Overall Duration (min)</Label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <Input
                                    type="number"
                                    value={testData.duration}
                                    onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) || 0 })}
                                    className="h-14 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 text-lg font-bold pl-12"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Builder (Matches TestCreation.tsx) */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                <div className="h-2 w-8 bg-blue-600 rounded-full"></div>
                                Test Sections
                            </h3>
                            <Badge className="bg-slate-100 text-slate-600 border-none px-4 py-1.5 font-bold rounded-full">
                                {testData.sections.length} Sections Defined
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Section Name</Label>
                                <Input
                                    placeholder="e.g. Biology"
                                    value={sectionForm.name}
                                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                                    className="rounded-xl bg-slate-50 border-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dur (min)</Label>
                                <Input
                                    type="number"
                                    placeholder="30"
                                    value={sectionForm.duration}
                                    onChange={(e) => setSectionForm({ ...sectionForm, duration: e.target.value })}
                                    className="rounded-xl bg-slate-50 border-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Marks/Q</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="4"
                                    value={sectionForm.marksPerQuestion}
                                    onChange={(e) => setSectionForm({ ...sectionForm, marksPerQuestion: e.target.value })}
                                    className="rounded-xl bg-slate-50 border-none font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-red-400 uppercase tracking-widest pl-1">Neg Marks</Label>
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder="1"
                                    value={sectionForm.negativeMarks}
                                    onChange={(e) => setSectionForm({ ...sectionForm, negativeMarks: e.target.value })}
                                    className="rounded-xl bg-slate-50 border-none font-bold text-red-600"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleAddSection} className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold shadow-lg shadow-slate-200">
                                    {editingSectionId ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                    {editingSectionId ? "Update" : "Add Section"}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {testData.sections.length === 0 && (
                                <div className="w-full py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 opacity-60">
                                    <Target className="h-10 w-10 mb-2" />
                                    <p className="font-bold text-sm">Add your first section to begin</p>
                                </div>
                            )}
                            {testData.sections.map((s: any) => (
                                <div
                                    key={s.id}
                                    className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all cursor-pointer shadow-sm ${activeSectionId === s.id
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100'
                                        : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200'
                                        }`}
                                    onClick={() => setActiveSectionId(s.id)}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Section</span>
                                        <span className="text-base font-black">{s.name} ({s.questions.length})</span>
                                    </div>
                                    <div className={`flex items-center gap-1 pl-3 border-l ${activeSectionId === s.id ? 'border-white/20' : 'border-slate-100'}`}>
                                        <button onClick={(e) => { e.stopPropagation(); handleEditSectionStart(s); }} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setTestData((prev: any) => ({ ...prev, sections: prev.sections.filter((x: any) => x.id !== s.id) })); }} className="p-1 hover:bg-red-400 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Question Builder (Matches TestCreation.tsx) */}
                    {activeSectionId && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                                        <FileText className="text-blue-600 h-6 w-6" />
                                    </div>
                                    Add Questions to: <span className="text-blue-600">{testData.sections.find((s: any) => s.id === activeSectionId)?.name}</span>
                                </h3>
                            </div>

                            <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Question Content</Label>
                                    <Textarea
                                        placeholder="Type your question here..."
                                        value={questionForm.text}
                                        onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}
                                        className="min-h-[120px] rounded-3xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 p-6 text-lg font-medium leading-relaxed"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Question Image (Optional)</Label>
                                    <div className="relative flex items-center gap-4">
                                        <div className="flex-1 relative">
                                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 pointer-events-none" />
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setQuestionForm({ ...questionForm, image: reader.result as string });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="h-14 rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-none shadow-sm focus:ring-2 focus:ring-blue-500 pl-16 pt-3 cursor-pointer"
                                            />
                                        </div>
                                        {questionForm.image && (
                                            <div className="relative shrink-0">
                                                <img src={questionForm.image} alt="Preview" className="h-14 w-14 object-cover rounded-xl border-2 border-slate-200 shadow-sm" />
                                                <button
                                                    onClick={() => setQuestionForm({ ...questionForm, image: "" })}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                                                    title="Remove Image"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['A', 'B', 'C', 'D'].map((opt) => (
                                        <div key={opt} className="space-y-2 relative">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-black shadow-sm z-10">
                                                {opt}
                                            </div>
                                            <Input
                                                placeholder={`Option ${opt}`}
                                                value={(questionForm as any)[`option${opt}`]}
                                                onChange={e => setQuestionForm({ ...questionForm, [`option${opt}`]: e.target.value })}
                                                className="h-16 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 pl-16 font-bold"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end pt-4">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Correct Answer</Label>
                                        <Select value={questionForm.correctOption} onValueChange={val => setQuestionForm({ ...questionForm, correctOption: val })}>
                                            <SelectTrigger className="h-16 rounded-2xl border-none shadow-sm bg-white font-black text-lg">
                                                <SelectValue placeholder="Select correct option" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {["A", "B", "C", "D"].map(o => <SelectItem key={o} value={o} className="h-12 font-bold">Option {o}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-4">
                                        {editingQuestionId && (
                                            <Button variant="outline" className="h-16 rounded-2xl border-2 border-slate-200 font-bold px-8" onClick={() => { setEditingQuestionId(null); setQuestionForm({ text: "", image: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "" }); }}>
                                                Cancel
                                            </Button>
                                        )}
                                        <Button onClick={handleAddQuestion} className="h-16 flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-xl shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]">
                                            {editingQuestionId ? <Edit size={24} className="mr-3" /> : <Plus size={24} className="mr-3" />}
                                            {editingQuestionId ? "Update Question" : "Save Question"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Stylized Question List (Matches TestCreation.tsx Cards) */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                    <Target size={16} />
                                    Added Questions in this Section
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {testData.sections.find((s: any) => s.id === activeSectionId)?.questions.length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] text-center text-slate-400">
                                            <p className="font-bold">No questions added yet.</p>
                                        </div>
                                    )}
                                    {testData.sections.find((s: any) => s.id === activeSectionId)?.questions.map((q: any, i: number) => (
                                        <Card key={q.id} className="border-none bg-white rounded-3xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start gap-6">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-1 w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                                                                {i + 1}
                                                            </div>
                                                            <p className="font-bold text-slate-800 text-lg leading-snug">{q.question}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pl-9">
                                                            {['A', 'B', 'C', 'D'].map((opt, idx) => (
                                                                <div key={opt} className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${q.correctAnswer === idx ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${q.correctAnswer === idx ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                                        {opt}
                                                                    </div>
                                                                    {q.options[idx]}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 group-hover:translate-x-0 transition-transform">
                                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => {
                                                            setEditingQuestionId(q.id);
                                                            setQuestionForm({
                                                                text: q.question,
                                                                image: q.image || "",
                                                                optionA: q.options[0],
                                                                optionB: q.options[1],
                                                                optionC: q.options[2],
                                                                optionD: q.options[3],
                                                                correctOption: ["A", "B", "C", "D"][q.correctAnswer],
                                                                explanation: q.explanation || ""
                                                            });
                                                        }}><Edit size={18} /></Button>
                                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-xl" onClick={() => {
                                                            setTestData((prev: any) => ({
                                                                ...prev,
                                                                sections: prev.sections.map((s: any) => s.id === activeSectionId ? {
                                                                    ...s,
                                                                    questions: s.questions.filter((x: any) => x.id !== q.id)
                                                                } : s)
                                                            }));
                                                        }}><Trash2 size={18} /></Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-8 flex gap-4 z-20">
                    <Button variant="ghost" className="h-14 rounded-2xl font-black text-slate-500 px-10" onClick={() => onOpenChange(false)}>Discard Draft</Button>
                    <Button
                        className="h-14 flex-1 rounded-2xl bg-slate-900 hover:bg-black font-black text-xl text-white shadow-2xl shadow-slate-200"
                        onClick={handleSaveTest}
                        disabled={loading}
                    >
                        {loading ? "Optimizing Practice Data..." : "Finalize & Save Practice Test"}
                        <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
