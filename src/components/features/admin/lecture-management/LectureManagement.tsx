import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Video, FileText, BookOpen, ChevronRight, Save, X, ExternalLink, Youtube, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Test } from "@/data/testData";
import { ChapterTestModal } from "./ChapterTestModal";

export const LectureManagement = () => {
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [subjects, setSubjects] = useState<string[]>(["Mathematics", "Reasoning", "Computer"]);
  const [tests, setTests] = useState<Test[]>([]);
  const [lectureStructure, setLectureStructure] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [portionDialogOpen, setPortionDialogOpen] = useState(false);
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [lectureDialogOpen, setLectureDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

  // Form States
  const [subjectName, setSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [portionName, setPortionName] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [lectureForm, setLectureForm] = useState({ title: "", videoUrl: "", duration: "" });
  const [selectedPortionId, setSelectedPortionId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [activeChapterForTest, setActiveChapterForTest] = useState<{ id: string | number, name: string, testId?: string } | null>(null);

  // Edit States
  const [editingPortion, setEditingPortion] = useState<any>(null);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [editingLecture, setEditingLecture] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchTests();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/config/lecture-structure");
      const data = await resp.json();
      setLectureStructure(data);
      if (data && Object.keys(data).length > 0) {
        setSubjects(Object.keys(data));
      }
    } catch (err) {
      toast.error("Failed to load lectures");
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    // No longer needed here as tests are chapter-specific now
  };

  const saveStructure = async (newStructure: any) => {
    setLectureStructure(newStructure);
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch("/api/config/lecture-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ structure: newStructure })
      });
      if (!resp.ok) throw new Error("Failed to save structure");
    } catch (err) {
      toast.error("Saved locally, but failed to sync with server");
      // Fallback for immediate UI feedback consistency, though we want server success
      localStorage.setItem('lecture_structure', JSON.stringify(newStructure));
    }
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) return;

    // Check if it already exists (and we're not just saving the same name)
    if (subjects.includes(subjectName) && subjectName !== editingSubject) {
      toast.error("Subject already exists!");
      return;
    }

    const newStructure = { ...lectureStructure };

    if (editingSubject) {
      // Renaming an existing subject
      newStructure[subjectName] = newStructure[editingSubject];
      if (subjectName !== editingSubject) {
        delete newStructure[editingSubject];
      }

      const newSubjects = subjects.map(s => s === editingSubject ? subjectName : s);
      setSubjects(newSubjects);
      if (selectedSubject === editingSubject) {
        setSelectedSubject(subjectName);
      }
      toast.success("Subject updated");
    } else {
      // Adding new subject
      newStructure[subjectName] = { portions: [] };
      setSubjects([...subjects, subjectName]);
      setSelectedSubject(subjectName);
      toast.success("Subject added");
    }

    await saveStructure(newStructure);
    setSubjectDialogOpen(false);
    setSubjectName("");
    setEditingSubject(null);
  };

  const handleDeleteSubject = async (subjectToDelete: string) => {
    if (confirm(`Are you sure you want to delete ${subjectToDelete} and all of its contents? This cannot be undone.`)) {
      const newStructure = { ...lectureStructure };
      delete newStructure[subjectToDelete];

      const newSubjects = subjects.filter(s => s !== subjectToDelete);
      setSubjects(newSubjects);

      if (selectedSubject === subjectToDelete) {
        setSelectedSubject(newSubjects.length > 0 ? newSubjects[0] : "");
      }

      await saveStructure(newStructure);
      toast.success(`Subject ${subjectToDelete} deleted`);
    }
  };

  // HANDLERS
  const handleAddPortion = async () => {
    const newStructure = { ...lectureStructure };

    // Ensure the subject exists in the structure
    if (!newStructure[selectedSubject]) {
      newStructure[selectedSubject] = { portions: [] };
    }

    const newPortion = {
      id: editingPortion ? editingPortion.id : `p-${Date.now()}`,
      name: portionName,
      chapters: editingPortion ? editingPortion.chapters : []
    };

    if (editingPortion) {
      newStructure[selectedSubject].portions = newStructure[selectedSubject].portions.map((p: any) =>
        p.id === editingPortion.id ? newPortion : p
      );
      toast.success("Portion updated");
    } else {
      newStructure[selectedSubject].portions.push(newPortion);
      toast.success("Portion added");
    }

    await saveStructure(newStructure);
    setPortionDialogOpen(false);
    setPortionName("");
    setEditingPortion(null);
  };

  const handleAddChapter = async () => {
    if (!selectedPortionId) return;
    const newStructure = { ...lectureStructure };

    // Safety check
    if (!newStructure[selectedSubject]) {
      newStructure[selectedSubject] = { portions: [] };
    }

    const portion = newStructure[selectedSubject].portions.find((p: any) => p.id === selectedPortionId);

    if (portion) {
      const newChapter = {
        id: editingChapter ? editingChapter.id : Date.now(),
        name: chapterName,
        lectures: editingChapter ? (editingChapter.lectures || []) : [],
        tests: editingChapter ? (editingChapter.tests || []) : []
      };

      if (editingChapter) {
        portion.chapters = portion.chapters?.map((c: any) => c.id === editingChapter.id ? newChapter : c) || [];
        toast.success("Chapter updated");
      } else {
        portion.chapters.push(newChapter);
        toast.success("Chapter added");
      }

      await saveStructure(newStructure);
      setChapterDialogOpen(false);
      setChapterName("");
      setEditingChapter(null);
    }
  };

  const handleAddLecture = async () => {
    if (!selectedPortionId || !selectedChapterId) return;
    const newStructure = { ...lectureStructure };
    const portion = newStructure[selectedSubject]?.portions.find((p: any) => p.id === selectedPortionId);
    if (!portion) return;
    const chapter = portion.chapters.find((c: any) => c.id === selectedChapterId);

    if (chapter) {
      const newLecture = {
        id: editingLecture ? editingLecture.id : Date.now(),
        ...lectureForm
      };

      if (editingLecture) {
        chapter.lectures = chapter.lectures?.map((l: any) => l.id === editingLecture.id ? newLecture : l) || [];
        toast.success("Lecture updated");
      } else {
        chapter.lectures.push(newLecture);
        toast.success("Lecture added");
      }

      await saveStructure(newStructure);
      setLectureDialogOpen(false);
      setLectureForm({ title: "", videoUrl: "", duration: "" });
      setEditingLecture(null);
    }
  };

  const handleAddTest = async () => {
    // Logic moved to ChatperTestModal
  };

  const deletePortion = (id: string) => {
    if (confirm("Are you sure you want to delete this portion and all its chapters? This cannot be undone.")) {
      const newStructure = { ...lectureStructure };
      newStructure[selectedSubject].portions = newStructure[selectedSubject].portions.filter((p: any) => p.id !== id);
      saveStructure(newStructure);
      toast.success("Portion deleted");
    }
  };

  const deleteChapter = (portionId: string, chapterId: number) => {
    if (confirm("Are you sure you want to delete this chapter and all its lectures/tests?")) {
      const newStructure = { ...lectureStructure };
      const portion = newStructure[selectedSubject].portions.find((p: any) => p.id === portionId);
      if (portion) {
        portion.chapters = portion.chapters.filter((c: any) => c.id !== chapterId);
        saveStructure(newStructure);
        toast.success("Chapter deleted");
      }
    }
  };

  const deleteLecture = (portionId: string, chapterId: number, lectureId: number) => {
    if (confirm("Are you sure you want to delete this video lecture?")) {
      const newStructure = { ...lectureStructure };
      const portion = newStructure[selectedSubject].portions.find((p: any) => p.id === portionId);
      const chapter = portion?.chapters.find((c: any) => c.id === chapterId);
      if (chapter) {
        chapter.lectures = chapter.lectures.filter((l: any) => l.id !== lectureId);
        saveStructure(newStructure);
        toast.success("Lecture deleted");
      }
    }
  };

  const deleteTest = (portionId: string, chapterId: number, testId: string) => {
    if (confirm("Are you sure you want to delete this practice test?")) {
      // Handling via dedicated database now if needed, but for now we just remove from structure
      const newStructure = { ...lectureStructure };
      const portion = newStructure[selectedSubject].portions.find((p: any) => p.id === portionId);
      const chapter = portion?.chapters.find((c: any) => c.id === chapterId);
      if (chapter) {
        if (Array.isArray(chapter.chapterTests)) {
          chapter.chapterTests = chapter.chapterTests.filter((t: any) => t.id !== testId);
        } else if (chapter.chapterTestId === testId) {
          chapter.chapterTestId = null; // Clean up old singular test if legacy
        }
        saveStructure(newStructure);
        toast.success("Chapter test removed");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lecture Management</h1>
        <Button onClick={() => { setEditingSubject(null); setSubjectName(""); setSubjectDialogOpen(true); }} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="flex flex-col md:flex-row gap-8 w-full items-start">
        {/* Vertical Tabs Bar */}
        <div className="w-full md:w-64 flex-shrink-0 sticky top-24">
          <div className="bg-slate-50/50 p-2 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 mb-1">Subjects</h3>
            <TabsList className="flex flex-col h-auto w-full items-stretch bg-transparent p-0 gap-1">
              {subjects.map((subject) => (
                <div key={subject} className="flex items-center w-full relative group">
                  <TabsTrigger
                    value={subject}
                    className="justify-start px-4 py-3 text-left font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-700 w-full rounded-xl data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-blue-100 transition-all text-sm pr-16"
                  >
                    <BookOpen className="w-4 h-4 mr-3 opacity-70" />
                    <span className="truncate">{subject}</span>
                  </TabsTrigger>

                  {/* Actions overlay - only show on hover or when active */}
                  <div className={`absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedSubject === subject ? 'opacity-100' : ''}`}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 ${selectedSubject === subject ? 'text-blue-500 hover:text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSubject(subject);
                        setSubjectName(subject);
                        setSubjectDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-7 w-7 ${selectedSubject === subject ? 'text-red-400 hover:text-red-600' : 'text-slate-400 hover:text-red-500'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(subject);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 w-full min-w-0">
          {subjects.map((subject) => (
            <TabsContent key={subject} value={subject} className="m-0 space-y-6 focus:outline-none focus-visible:ring-0">
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">{subject} Syllabus</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Manage portions, chapters, tests, and video lectures.</p>
                </div>
                <Button onClick={() => { setEditingPortion(null); setPortionName(""); setPortionDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 font-bold rounded-xl px-5 h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Portion
                </Button>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-4">
                {lectureStructure[selectedSubject]?.portions?.map((portion: any) => (
                  <AccordionItem key={portion.id} value={portion.id} className="border rounded-xl bg-white px-4 shadow-sm overflow-hidden">
                    <div className="flex items-center">
                      <AccordionTrigger className="hover:no-underline py-4 flex-1">
                        <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                          <span>{portion.name}</span>
                          <Badge variant="secondary" className="font-normal ml-2">{portion.chapters.length} Chapters</Badge>
                        </div>
                      </AccordionTrigger>
                      <div className="flex gap-1 pr-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={(e) => { e.stopPropagation(); setEditingPortion(portion); setPortionName(portion.name); setPortionDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); deletePortion(portion.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <AccordionContent className="pt-4 pb-4 space-y-4 border-t border-slate-50">
                      <div className="flex justify-between items-center mb-2 px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Chapters</h3>
                        <Button size="sm" variant="outline" className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => { setSelectedPortionId(portion.id); setChapterName(""); setEditingChapter(null); setChapterDialogOpen(true); }}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Chapter
                        </Button>
                      </div>

                      {portion.chapters?.map((chapter: any) => (
                        <Card key={chapter.id} className="border-none bg-slate-50/50 rounded-2xl">
                          <CardHeader className="py-3 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-3 text-base font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                {chapter.name}
                              </CardTitle>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedPortionId(portion.id); setEditingChapter(chapter); setChapterName(chapter.name); setChapterDialogOpen(true); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteChapter(portion.id, chapter.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                                    <Video className="h-3.5 w-3.5" />
                                    Video Lectures
                                  </h4>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 font-bold hover:bg-blue-50" onClick={() => { setSelectedPortionId(portion.id); setSelectedChapterId(chapter.id); setEditingLecture(null); setLectureForm({ title: "", videoUrl: "", duration: "" }); setLectureDialogOpen(true); }}>
                                    <Plus className="h-3 w-3 mr-1" /> Add
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {chapter.lectures?.map((lecture: any) => (
                                    <div key={lecture.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-sm flex justify-between items-center group hover:border-blue-200 transition-all">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 transition-colors">
                                          <Youtube className="h-5 w-5 text-red-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="truncate">
                                          <div className="font-bold text-slate-700 truncate">{lecture.title}</div>
                                          <div className="text-xs text-slate-400 flex items-center gap-3">
                                            <span className="flex items-center gap-1"><Clock size={12} /> {lecture.duration}</span>
                                            <span className="flex items-center gap-1 text-blue-500 font-medium">
                                              <ExternalLink size={12} /> Link Added
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => { setSelectedPortionId(portion.id); setSelectedChapterId(chapter.id); setEditingLecture(lecture); setLectureForm({ title: lecture.title, videoUrl: lecture.videoUrl, duration: lecture.duration }); setLectureDialogOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteLecture(portion.id, chapter.id, lecture.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </div>
                                    </div>
                                  ))}
                                  {chapter.lectures.length === 0 && <div className="text-xs text-slate-400 font-medium italic py-4 text-center border-2 border-dashed rounded-xl border-slate-100">No lectures added</div>}
                                </div>
                              </div>

                              {/* Tests */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                                    <FileText className="h-3.5 w-3.5" />
                                    Chapter Practice Test
                                  </h4>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 font-bold hover:bg-blue-50" onClick={() => { setActiveChapterForTest({ id: chapter.id, name: chapter.name }); setTestDialogOpen(true); }}>
                                      <Plus className="h-3 w-3 mr-1" /> Add Chapter Test
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {/* Support both legacy singular `chapterTestId` and the new `chapterTests` array */}
                                  {chapter.chapterTestId && !chapter.chapterTests && (
                                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-sm flex justify-between items-center group hover:border-green-200 transition-all">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors">
                                          <FileText className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="truncate">
                                          <div className="font-bold text-slate-700 truncate">Chapter Practice Test</div>
                                          <div className="text-xs text-slate-400 font-medium">
                                            Dedicated Chapter Test • Unlimited Attempts
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => { setActiveChapterForTest({ id: chapter.id, name: chapter.name, testId: chapter.chapterTestId }); setTestDialogOpen(true); }}>
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteTest(portion.id, chapter.id, chapter.chapterTestId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </div>
                                    </div>
                                  )}
                                  {chapter.chapterTests?.map((test: any, idx: number) => (
                                    <div key={test.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-sm flex justify-between items-center group hover:border-green-200 transition-all">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors">
                                          <FileText className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="truncate">
                                          <div className="font-bold text-slate-700 truncate">Practice Test {idx + 1}</div>
                                          <div className="text-xs text-slate-400 font-medium flex gap-2">
                                            <span>{test.totalQuestions || 0} Questions</span>
                                            <span>•</span>
                                            <span>{test.duration || 0} min</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => { setActiveChapterForTest({ id: chapter.id, name: chapter.name, testId: test.id }); setTestDialogOpen(true); }}>
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteTest(portion.id, chapter.id, test.id)}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {!chapter.chapterTestId && (!chapter.chapterTests || chapter.chapterTests.length === 0) && <div className="text-xs text-slate-400 font-medium italic py-4 text-center border-2 border-dashed rounded-xl border-slate-100">No chapter tests created</div>}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* DIALOGS */}
      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">{editingSubject ? "Rename this subject area." : "Create a new subject area for lectures."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Subject Name</Label>
              <Input
                placeholder="e.g. English, History"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="h-12 rounded-xl font-bold text-slate-500" onClick={() => setSubjectDialogOpen(false)}>Cancel</Button>
            <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-blue-100" onClick={handleAddSubject}>
              <Save size={18} className="mr-2" />
              {editingSubject ? "Save Changes" : "Save Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Portion Dialog */}
      <Dialog open={portionDialogOpen} onOpenChange={setPortionDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">{editingPortion ? "Edit Portion" : "Add New Portion"}</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">Enter the name for this syllabus portion in {selectedSubject}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Portion Name</Label>
              <Input
                placeholder="e.g. Calculus, Algebra, Verbal Reasoning"
                value={portionName}
                onChange={(e) => setPortionName(e.target.value)}
                className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="h-12 rounded-xl font-bold text-slate-500" onClick={() => setPortionDialogOpen(false)}>Cancel</Button>
            <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-blue-100" onClick={handleAddPortion}>
              <Save size={18} className="mr-2" />
              {editingPortion ? "Update Portion" : "Create Portion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">{editingChapter ? "Edit Chapter" : "Add New Chapter"}</DialogTitle>
            <DialogDescription className="font-medium text-slate-500">Create a new chapter within the portion.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Chapter Name</Label>
              <Input
                placeholder="e.g. Limits, Integration, Syllogism"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="h-12 rounded-xl font-bold text-slate-500" onClick={() => setChapterDialogOpen(false)}>Cancel</Button>
            <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-blue-100" onClick={handleAddChapter}>
              <Save size={18} className="mr-2" />
              Save Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lecture Dialog */}
      <Dialog open={lectureDialogOpen} onOpenChange={setLectureDialogOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <Youtube className="text-red-500 h-6 w-6" />
              </div>
              {editingLecture ? "Edit Video Lecture" : "Add Video Lecture"}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">Link a YouTube video for this chapter.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 font-medium text-slate-700">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Lecture Title</Label>
              <Input
                placeholder="e.g. Introduction to Syllogism"
                value={lectureForm.title}
                onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">YouTube URL</Label>
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lectureForm.videoUrl}
                  onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                  className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">Duration</Label>
              <Input
                placeholder="e.g. 45 min"
                value={lectureForm.duration}
                onChange={(e) => setLectureForm({ ...lectureForm, duration: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="h-12 rounded-xl font-bold text-slate-500" onClick={() => setLectureDialogOpen(false)}>Cancel</Button>
            <Button className="h-12 rounded-xl bg-red-600 hover:bg-red-700 font-bold px-8 shadow-lg shadow-red-100" onClick={handleAddLecture}>
              Save Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      {/* Chapter Test Builder Modal */}
      {activeChapterForTest && (
        <ChapterTestModal
          open={testDialogOpen}
          onOpenChange={(val) => {
            setTestDialogOpen(val);
            if (!val) {
              setActiveChapterForTest(null);
            }
          }}
          chapterId={activeChapterForTest.id}
          chapterName={activeChapterForTest.name}
          testId={activeChapterForTest.testId}
          onSaveSuccess={(testMeta) => {
            // Update local structure with the new or edited test
            const newStructure = { ...lectureStructure };
            const port = newStructure[selectedSubject]?.portions.find((p: any) => p.chapters.some((c: any) => c.id === activeChapterForTest.id));
            const chap = port?.chapters.find((c: any) => c.id === activeChapterForTest.id);
            if (chap) {
              if (!chap.chapterTests) {
                chap.chapterTests = [];
              }

              // If updating an existing test in the array
              const existingIndex = chap.chapterTests.findIndex((t: any) => t.id === testMeta.id);
              if (existingIndex >= 0) {
                chap.chapterTests[existingIndex] = testMeta;
              } else {
                // If adding a completely new test
                chap.chapterTests.push(testMeta);
              }

              saveStructure(newStructure);
            }
          }}
        />
      )}
    </div>
  );
};
