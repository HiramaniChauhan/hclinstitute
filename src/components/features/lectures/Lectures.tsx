import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, BookOpen, CheckCircle, ChevronRight, FileText, Download, Youtube, Trophy, RotateCcw, X, Target, Award, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ChapterTestInterface } from "@/components/features/lectures/ChapterTestInterface";
import { Test } from "@/data/testData";
import { toast } from "sonner";

export const Lectures = () => {
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [subjects, setSubjects] = useState<string[]>(["Mathematics", "Reasoning", "Computer"]);
  const [lectureStructure, setLectureStructure] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Interaction states
  const [activeLecture, setActiveLecture] = useState<any>(null);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [testMode, setTestMode] = useState<'take' | 'review' | null>(null);

  // Persistence logic (Mocking attempt storage)
  const [attempts, setAttempts] = useState<Record<string, any[]>>({});
  const [showInstructions, setShowInstructions] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/config/lecture-structure");
      const data = await resp.json();
      setLectureStructure(data);
      if (data && Object.keys(data).length > 0) {
        setSubjects(Object.keys(data));
        if (!Object.keys(data).includes(selectedSubject) && Object.keys(data).length > 0) {
          setSelectedSubject(Object.keys(data)[0]);
        }
      }
    } catch (err) {
      toast.error("Failed to load lectures");
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    try {
      let videoId = "";
      if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      }
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (e) {
      return "";
    }
  };

  const handleStartTest = async (testId: string | number) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`/api/chapter-tests/test/${testId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error("No practice test found");
      const testData = await resp.json();

      // Normalize ID to ensure handleCompleteTest can retrieve it reliably
      if (!testData.id && !testData.chapterId) testData.id = testId;
      if (!testData.chapterId) testData.chapterId = testId;

      setActiveTest(testData);
      setReviewMode(false);
      setShowInstructions(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReviewTest = async (testId: string | number) => {
    try {
      const token = localStorage.getItem('token');
      // 1. Fetch the latest result first
      const res = await fetch(`/api/chapter-tests/results/latest/${testId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("No recent result found");
      const lastResult = await res.json();
      if (!lastResult) throw new Error("No recent result found");

      // 2. Fetch the test structure
      const resp = await fetch(`/api/chapter-tests/test/${testId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error("Failed to fetch test structure");
      const testData = await resp.json();

      // Normalize ID
      if (!testData.id && !testData.chapterId) testData.id = testId;
      if (!testData.chapterId) testData.chapterId = testId;

      setActiveTest(testData);
      setReviewMode(true);
      setAttempts(prev => ({ ...prev, [String(testId)]: [lastResult] }));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCompleteTest = async (results: any) => {
    const testId = (activeTest as any)?.chapterId || (activeTest as any)?.testId || (activeTest as any)?.id;
    if (testId) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("/api/chapter-tests/results", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            chapterId: testId, // mapping testId to chapterId in DB schema for consistency
            score: results.score,
            totalMarks: results.totalMarks,
            userAnswers: results.userAnswers
          })
        });

        if (res.ok) {
          const savedResult = await res.json();
          setAttempts(prev => ({
            ...prev,
            [String(testId)]: [savedResult]
          }));
          toast.success("Practice test completed!");
        }
      } catch (err) {
        console.error("Failed to save result", err);
      }
    }
    setActiveTest(null);
    setReviewMode(false);
    setShowInstructions(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-4 w-48 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Lectures</h1>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Study Plan
        </Button>
      </div>

      <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="w-full">
        <div className="overflow-x-auto pb-2 mb-6">
          <TabsList className="inline-flex w-auto min-w-full justify-start h-12 p-1">
            {subjects.map((subject) => (
              <TabsTrigger key={subject} value={subject} className="px-6 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-lg font-bold text-sm h-full">
                {subject}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {subjects.map((subject) => (
          <TabsContent key={subject} value={subject} className="space-y-6">

            <Accordion type="single" collapsible className="w-full space-y-4">
              {(lectureStructure[subject]?.portions?.length || 0) === 0 && (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <BookOpen className="text-slate-300 h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No content uploaded yet</h3>
                  <p className="text-sm text-slate-500 font-medium">Please check back later for updates in {subject}.</p>
                </div>
              )}
              {lectureStructure[subject]?.portions?.map((portion: any) => (
                <AccordionItem key={portion.id} value={portion.id} className="border rounded-2xl bg-white px-5 shadow-sm overflow-hidden border-slate-100">
                  <AccordionTrigger className="hover:no-underline py-5 group">
                    <div className="flex items-center gap-3 text-lg font-black text-slate-800 tracking-tight">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <BookOpen className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <span>{portion.name}</span>
                      <Badge variant="secondary" className="font-bold ml-2 bg-slate-100 text-slate-500 border-none">{portion.chapters.length} Chapters</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-5 space-y-5 border-t border-slate-50">
                    {portion.chapters.map((chapter: any) => (
                      <Card key={chapter.id} className="border-none bg-slate-50/70 rounded-3xl overflow-hidden shadow-none">
                        <CardHeader className="py-4 px-6 bg-white/50 border-b border-white">
                          <CardTitle className="flex items-center gap-3 text-base font-black text-slate-700 tracking-tight">
                            <BookOpen size={18} className="text-blue-500" />
                            {chapter.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 px-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Lectures */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest pl-1">
                                <Play className="h-3.5 w-3.5" />
                                Video Lectures
                              </h4>
                              <div className="grid gap-2">
                                {chapter.lectures.map((lecture: any) => (
                                  <div
                                    key={lecture.id}
                                    onClick={() => setActiveLecture(lecture)}
                                    className="p-4 bg-white rounded-2xl border border-white shadow-sm flex items-center justify-between group hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all cursor-pointer"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                                        <Youtube className="h-5 w-5 text-red-600 group-hover:text-white transition-colors" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{lecture.title}</div>
                                        <div className="text-xs text-slate-400 font-bold flex items-center gap-2">
                                          <Clock size={12} /> {lecture.duration}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-white transition-colors" />
                                    </div>
                                  </div>
                                ))}
                                {chapter.lectures.length === 0 && <div className="text-xs text-slate-400 font-bold italic py-6 text-center border-2 border-dashed rounded-3xl border-slate-200 bg-slate-50/30">No lectures in this chapter</div>}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-xs font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest pl-1">
                                <FileText className="h-3.5 w-3.5" />
                                Chapter Practice Test
                              </h4>
                              <div className="grid gap-2">
                                {/* Legacy single test support */}
                                {chapter.chapterTestId && (!chapter.chapterTests || chapter.chapterTests.length === 0) && (
                                  <div className="p-4 bg-white rounded-2xl border border-white shadow-sm flex flex-col md:flex-row md:items-center justify-between group hover:border-green-400 hover:shadow-lg hover:shadow-green-50 transition-all gap-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-green-500" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-800">Chapter Support Test</div>
                                        <div className="text-xs text-slate-400 font-bold flex items-center gap-3">
                                          <span>Practice Mode</span>
                                          <span>•</span>
                                          <span>Unlimited Attempts</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-9 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                                          onClick={() => handleReviewTest(chapter.chapterTestId)}
                                        >
                                          Review Last
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-9 rounded-xl font-bold px-5 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                                          onClick={() => handleStartTest(chapter.chapterTestId)}
                                        >
                                          Start Practice
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Multi-test array support */}
                                {chapter.chapterTests?.map((test: any, idx: number) => (
                                  <div key={test.id} className="p-4 bg-white rounded-2xl border border-white shadow-sm flex flex-col md:flex-row md:items-center justify-between group hover:border-green-400 hover:shadow-lg hover:shadow-green-50 transition-all gap-4">
                                    <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-green-500" />
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-800">Practice Test {idx + 1}</div>
                                        <div className="text-xs text-slate-400 font-bold flex items-center gap-3">
                                          <span>{test.totalQuestions || 0} Questions</span>
                                          <span>•</span>
                                          <span>{test.duration || 30} min</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-9 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                                          onClick={() => handleReviewTest(test.id)}
                                        >
                                          Review Last
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-9 rounded-xl font-bold px-5 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                                          onClick={() => handleStartTest(test.id)}
                                        >
                                          Start Practice
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {!chapter.chapterTestId && (!chapter.chapterTests || chapter.chapterTests.length === 0) && (
                                  <div className="text-xs text-slate-400 font-bold italic py-6 text-center border-2 border-dashed rounded-3xl border-slate-200 bg-slate-50/30">No test created yet for this chapter</div>
                                )}
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
      </Tabs>

      {/* VIDEO PLAYER DIALOG */}
      <Dialog open={!!activeLecture} onOpenChange={(open) => !open && setActiveLecture(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black rounded-3xl border-none shadow-2xl">
          <div className="aspect-video w-full bg-slate-900 flex items-center justify-center">
            {activeLecture?.videoUrl ? (
              <iframe
                src={getYoutubeEmbedUrl(activeLecture.videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="text-white text-center font-bold">
                <Youtube size={64} className="text-red-500 mx-auto mb-4 animate-pulse" />
                No video link provided
              </div>
            )}
          </div>
          <div className="p-6 bg-white flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{activeLecture?.title}</h3>
              <p className="text-sm text-slate-500 font-bold flex items-center gap-2 mt-1">
                <Clock size={14} /> Duration: {activeLecture?.duration}
              </p>
            </div>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:bg-slate-50 rounded-full" onClick={() => setActiveLecture(null)}>
              <RotateCcw className="rotate-45" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TEST INTERFACE MODAL */}
      {activeTest && !showInstructions && (
        <ChapterTestInterface
          test={activeTest}
          onComplete={handleCompleteTest}
          onCancel={() => { setActiveTest(null); setReviewMode(false); }}
          reviewMode={reviewMode}
          allAttempts={attempts[String((activeTest as any).chapterId || (activeTest as any).testId || (activeTest as any).id)] || []}
        />
      )}

      {/* FULL-PAGE INSTRUCTIONS OVERLAY (Matches Tests.tsx) */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none border-none shadow-none p-0 overflow-y-auto bg-white z-[120]">
          <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-600 rounded-[28px] shadow-xl shadow-blue-100">
                  <FileText className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">General Instructions</h1>
                  <p className="text-xl text-blue-600 font-bold mt-1 uppercase tracking-wider">{activeTest?.title}</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-2xl border-2 h-12 px-6 font-bold" onClick={() => { setShowInstructions(false); setActiveTest(null); setReviewMode(false); }}>
                GO BACK
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: CBT Guidelines */}
              <div className="lg:col-span-7 space-y-10">
                <section className="space-y-6">
                  <h2 className="text-2xl font-black flex items-center gap-4 text-slate-800">
                    <div className="w-2 h-8 bg-blue-600 rounded-full" />
                    Examination Guidelines
                  </h2>
                  <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200">
                    <ul className="text-lg text-slate-600 space-y-4 list-none">
                      <li className="flex gap-4">
                        <span className="font-black text-blue-600 text-2xl leading-none">•</span>
                        <span>Total duration of this test is <strong className="text-slate-900">{activeTest?.duration} minutes</strong>.</span>
                      </li>
                      <li className="flex gap-4">
                        <span className="font-black text-blue-600 text-2xl leading-none">•</span>
                        <span>This is a <strong className="text-slate-900">Chapter Practice Test</strong> with unlimited attempts allowed.</span>
                      </li>
                      <li className="flex gap-4">
                        <span className="font-black text-blue-600 text-2xl leading-none">•</span>
                        <span>Performance is tracked to help you improve. Re-take the test as many times as you need.</span>
                      </li>
                      <li className="flex gap-4">
                        <span className="font-black text-blue-600 text-2xl leading-none">•</span>
                        <span>When the timer reaches zero, your test will be <strong className="text-slate-900">automatically submitted</strong>.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-6">
                  <h2 className="text-2xl font-black flex items-center gap-4 text-slate-800">
                    <div className="w-2 h-8 bg-purple-600 rounded-full" />
                    Question Palette Legend
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-5 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center text-sm font-black text-slate-400">01</div>
                      <span className="text-base font-bold text-slate-600">Not Visited</span>
                    </div>
                    <div className="flex items-center gap-5 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-red-100">02</div>
                      <span className="text-base font-bold text-slate-600">Not Answered</span>
                    </div>
                    <div className="flex items-center gap-5 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-green-100">03</div>
                      <span className="text-base font-bold text-slate-600">Answered & Saved</span>
                    </div>
                    <div className="flex items-center gap-5 p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-purple-100">04</div>
                      <span className="text-base font-bold text-slate-600">Marked for Review</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Test Structure */}
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                  <h2 className="text-2xl font-black mb-8 flex items-center gap-4">
                    <Target size={28} className="text-blue-400" />
                    Test Structure
                  </h2>
                  <div className="space-y-4">
                    {activeTest?.sections.map((section: any, idx: number) => (
                      <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                          <p className="font-black text-xl text-blue-50 group-hover:text-blue-300 transition-colors">{section.name}</p>
                          <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30 font-black">SEC {idx + 1}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                          <div className="flex items-center gap-3 text-slate-400">
                            <FileText size={18} className="text-blue-400" />
                            {section.questions.length} Questions
                          </div>
                          <div className="flex items-center gap-3 text-emerald-400 text-base">
                            <Award size={18} />
                            +{section.marksPerQuestion || 1} Marks
                          </div>
                          <div className="flex items-center gap-3 text-red-400 col-span-2">
                            <AlertCircle size={18} />
                            {section.negativeMarks || 0} Negative Marking
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-blue-50/50 rounded-[32px] border-2 border-blue-100 space-y-4">
                  <h3 className="text-lg font-black text-blue-800 flex items-center gap-2">
                    <Award className="text-blue-600" />
                    Pro Tip
                  </h3>
                  <p className="text-blue-900 font-medium leading-relaxed">
                    Accuracy matters more than speed in practice tests. Review your answers in the palette before final submission.
                  </p>
                </div>

                <Button
                  onClick={() => setShowInstructions(false)}
                  className="w-full h-20 text-2xl font-black bg-blue-600 hover:bg-blue-700 text-white rounded-[28px] shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] group flex items-center justify-center gap-4 mt-4"
                >
                  I AM READY TO BEGIN
                  <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
