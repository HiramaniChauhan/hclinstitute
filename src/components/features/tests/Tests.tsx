import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Clock, Target, Search, Calendar, Award, AlertCircle, Info, BookOpen, CheckCircle } from "lucide-react";
import { dummyTests, Test } from "@/data/testData";
import { TestInterface } from "./TestInterface";
import { toast } from "sonner";

import { useEffect } from "react";

export const Tests = () => {
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [allAttempts, setAllAttempts] = useState<any[]>([]);
  const [initialAttemptIdx, setInitialAttemptIdx] = useState<number | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [instructionsTest, setInstructionsTest] = useState<Test | null>(null); // test pending instructions

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const [testsResp, resultsResp] = await Promise.all([
        fetch("/api/tests", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("/api/results/my-results", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);
      const testsData = await testsResp.json();
      const resultsData = await resultsResp.json();

      if (Array.isArray(testsData)) {
        // Sort by scheduled date
        const sorted = testsData.sort((a, b) => {
          const dateA = a.startDate ? new Date(`${a.startDate}T${a.startTime || '00:00'}`) : new Date(0);
          const dateB = b.startDate ? new Date(`${b.startDate}T${b.startTime || '00:00'}`) : new Date(0);
          return dateA.getTime() - dateB.getTime();
        });
        setTests(sorted);
      }
      if (Array.isArray(resultsData)) {
        setUserResults(resultsData);
      }
    } catch (error) {
      toast.error("Failed to load test data");
    } finally {
      setLoading(false);
    }
  };

  const isTestCompleted = (testId: string | number) => {
    return userResults.some(r => String(r.testId) === String(testId));
  };

  const getAttemptCount = (testId: string | number) => {
    return userResults.filter(r => String(r.testId) === String(testId)).length;
  };

  const upcomingTests = tests.filter(t => {
    const testId = t.testId || t.id;
    const isCompleted = isTestCompleted(testId);
    if (isCompleted) return false;

    const now = new Date();
    const endTime = t.endDate ? new Date(`${t.endDate}T${t.endTime || '23:59'}`) : null;
    const isPast = endTime && endTime < now;

    return t.startDate && !isPast;
  }).sort((a, b) => {
    const dateA = a.startDate ? new Date(`${a.startDate}T${a.startTime || '00:00'}`) : new Date(0);
    const dateB = b.startDate ? new Date(`${b.startDate}T${b.startTime || '00:00'}`) : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  const practiceTests = tests.filter(t => {
    const testId = t.testId || t.id;
    const isCompleted = isTestCompleted(testId);

    const now = new Date();
    const endTime = t.endDate ? new Date(`${t.endDate}T${t.endTime || '23:59'}`) : null;
    const isPast = endTime && endTime < now;

    return !t.startDate || isPast || isCompleted;
  }).sort((a, b) => {
    // Sort by end date descending (newest first)
    const dateA = a.endDate ? new Date(`${a.endDate}T${a.endTime || '23:59'}`) : new Date(0);
    const dateB = b.endDate ? new Date(`${b.endDate}T${b.endTime || '23:59'}`) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const matchesSearch = (test: Test) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      test.title.toLowerCase().includes(q) ||
      (test.subject && test.subject.toLowerCase().includes(q)) ||
      (test.difficulty && test.difficulty.toLowerCase().includes(q)) ||
      test.sections.some(s => s.name.toLowerCase().includes(q))
    );
  };

  const handleStartTest = (test: Test, isScheduled = false) => {
    const testId = test.testId || test.id;
    const attemptCount = getAttemptCount(testId);
    if (attemptCount >= 2) {
      toast.error("You have already used both attempts for this test.");
      return;
    }

    // For live scheduled tests enforce the time window
    if (isScheduled && test.startDate && test.startTime) {
      const now = new Date();
      const start = new Date(`${test.startDate}T${test.startTime}`);
      const end = test.endDate ? new Date(`${test.endDate}T${test.endTime || '23:59'}`) : null;
      if (now < start) {
        toast.error(`This test has not started yet. It opens at ${test.startTime} on ${test.startDate}.`);
        return;
      }
      if (end && now > end) {
        toast.error("This test has already ended. It is no longer available.");
        return;
      }
    }

    // Show instructions before entering
    setInstructionsTest(test);
  };

  const handleConfirmStart = () => {
    if (!instructionsTest) return;
    setActiveTest(instructionsTest);
    setInstructionsTest(null);
  };

  const handleCompleteTest = async (results: any) => {
    setActiveTest(null);
    toast.success("Test completed successfully!");
    await fetchData(); // Refresh data
  };

  if (activeTest) {
    return (
      <TestInterface
        test={activeTest}
        onComplete={handleCompleteTest}
        onCancel={() => { setActiveTest(null); setReviewMode(false); setSelectedResult(null); setInitialAttemptIdx(undefined); }}
        reviewMode={reviewMode}
        answers={selectedResult?.userAnswers}
        allAttempts={allAttempts}
        initialAttemptIdx={initialAttemptIdx}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tests</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search by name, subject, section..."
                className="pl-10 w-72"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 px-2">✕ Clear</Button>
            )}
          </div>
        </div>

        {/* Regular Scheduled Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Scheduled Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-6 text-gray-400">Loading tests...</div>
              ) : upcomingTests.filter(matchesSearch).length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  {searchQuery ? `No scheduled tests match "${searchQuery}".` : 'No scheduled tests for today.'}
                </p>
              ) : upcomingTests.filter(matchesSearch).map((test) => {
                const testId = test.testId || test.id;
                const testIdStr = String(testId);
                const relatedResults = userResults
                  .filter(r => String(r.testId) === testIdStr)
                  .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
                const completed = relatedResults.length > 0;
                const hasRetake = relatedResults.length >= 2;

                return (
                  <div key={testId} className={`p-4 border rounded-lg ${completed ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{test.title}</h3>
                          {completed && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed ({relatedResults.length}/2)</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target size={14} />
                            {test.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {test.duration} minutes
                          </span>
                          {test.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              Start: {test.startDate} {test.startTime && `at ${test.startTime}`}
                            </span>
                          )}
                          {test.endDate && (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertCircle size={14} />
                              End: {test.endDate} {test.endTime && `at ${test.endTime}`}
                            </span>
                          )}
                        </div>
                        {/* Section names */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {test.sections.map(s => (
                            <Badge key={s.id} variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">{s.name}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary">{test.subject}</Badge>
                          <Badge variant={test.difficulty === 'Easy' ? 'default' : test.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                            {test.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Review buttons once each attempt exists */}
                        {relatedResults.length >= 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-600 hover:bg-amber-50"
                            onClick={() => {
                              setAllAttempts(relatedResults);
                              setSelectedResult(relatedResults[0]);
                              setInitialAttemptIdx(0);
                              setActiveTest(test);
                              setReviewMode(true);
                            }}
                          >
                            Review Original
                          </Button>
                        )}
                        {relatedResults.length >= 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setAllAttempts(relatedResults);
                              setSelectedResult(relatedResults[1]);
                              setInitialAttemptIdx(1);
                              setActiveTest(test);
                              setReviewMode(true);
                            }}
                          >
                            Review Retake
                          </Button>
                        )}
                        {/* Start / Retake / Disabled button */}
                        <Button
                          size="sm"
                          className={completed ? "bg-gray-500 hover:bg-gray-600" : "bg-blue-600 hover:bg-blue-700"}
                          onClick={() => handleStartTest(test, true)}
                          disabled={relatedResults.length >= 2}
                        >
                          {relatedResults.length >= 2
                            ? "Max Attempts (2/2)"
                            : completed ? "Retake Test" : "Start Test"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Practice & Past Tests */}
        <Card className="border-blue-100 bg-blue-50/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="text-blue-600" />
              Practice & Past Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="text-center py-6 text-gray-400">Loading tests...</div>
              ) : practiceTests.filter(matchesSearch).length === 0 ? (
                <p className="col-span-full text-center py-6 text-gray-500">
                  {searchQuery ? `No practice tests match "${searchQuery}".` : 'No practice tests available.'}
                </p>
              ) : practiceTests.filter(matchesSearch).map((test) => {
                const testIdStr = String(test.testId || test.id);
                const relatedResults = userResults
                  .filter(r => String(r.testId) === testIdStr)
                  .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

                const completed = relatedResults.length > 0;
                const hasRetake = relatedResults.length >= 2;

                const now = new Date();
                const endTime = test.endDate ? new Date(`${test.endDate}T${test.endTime || '23:59'}`) : null;
                const isPast = endTime && endTime < now;

                return (
                  <div key={testIdStr} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow relative">
                    <Badge className={`absolute top-2 right-2 ${completed ? 'bg-green-100 text-green-700' : isPast ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                      {completed ? `Completed (${relatedResults.length}/2 attempts)` : isPast ? 'Ended' : 'Practice'}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2 pr-24">{test.title}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-3">
                        <span className="flex items-center gap-1">
                          <Target size={14} />
                          {test.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {test.duration} minutes
                        </span>
                      </div>
                      {test.startDate && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Calendar size={14} />
                          Start: {test.startDate} {test.startTime && `at ${test.startTime}`}
                        </div>
                      )}
                      {test.endDate && (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle size={14} />
                          End: {test.endDate} {test.endTime && `at ${test.endTime}`}
                        </div>
                      )}
                      {/* Section names */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {test.sections.map(s => (
                          <Badge key={s.id} variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">{s.name}</Badge>
                        ))}
                      </div>
                    </div>

                    {!hasRetake && completed && (
                      <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-100 rounded text-[11px] text-amber-700">
                        <AlertCircle size={14} />
                        You have 1 retake remaining. Practice again!
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
                      <div className="flex gap-2">
                        <Badge variant="outline">{test.subject}</Badge>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {completed && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 border-amber-600 hover:bg-amber-50"
                              onClick={() => {
                                setAllAttempts(relatedResults);
                                setSelectedResult(relatedResults[0]);
                                setInitialAttemptIdx(0);
                                setActiveTest(test);
                                setReviewMode(true);
                              }}
                            >
                              Review Original
                            </Button>
                            {hasRetake && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setAllAttempts(relatedResults);
                                  setSelectedResult(relatedResults[1]);
                                  setInitialAttemptIdx(1);
                                  setActiveTest(test);
                                  setReviewMode(true);
                                }}
                              >
                                Review Retake
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant={completed ? "secondary" : "outline"}
                          size="sm"
                          className={completed ? "" : "text-blue-600 border-blue-600 hover:bg-blue-50"}
                          onClick={() => handleStartTest(test)}
                          disabled={relatedResults.length >= 2}
                        >
                          {relatedResults.length >= 2
                            ? "Max Attempts Reached (2/2)"
                            : completed ? "Retake Practice" : isPast ? "Start Practice" : "Take Test"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Instructions Dialog */}
      <Dialog open={!!instructionsTest} onOpenChange={open => { if (!open) setInstructionsTest(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="text-blue-600" size={22} />
              Test Instructions — {instructionsTest?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Read the instructions carefully before starting. Once you begin, the timer cannot be paused.
            </DialogDescription>
          </DialogHeader>

          {instructionsTest && (
            <div className="space-y-5 mt-2">
              {/* Section table */}
              <div>
                <p className="font-semibold text-gray-800 mb-2 flex items-center gap-1"><Info size={15} className="text-blue-500" /> Sections Overview</p>
                <div className="w-full overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-blue-800">Section</th>
                        <th className="text-center px-3 py-2 font-semibold text-blue-800">Questions</th>
                        <th className="text-center px-3 py-2 font-semibold text-blue-800">Time (min)</th>
                        <th className="text-center px-3 py-2 font-semibold text-blue-800">+Marks</th>
                        <th className="text-center px-3 py-2 font-semibold text-blue-800">-Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instructionsTest.sections.map((s, idx) => (
                        <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-3 py-2 font-medium">{s.name}</td>
                          <td className="px-3 py-2 text-center">{s.questions.length}</td>
                          <td className="px-3 py-2 text-center">{s.duration}</td>
                          <td className="px-3 py-2 text-center text-green-600 font-semibold">+{s.marksPerQuestion ?? 1}</td>
                          <td className="px-3 py-2 text-center text-red-600 font-semibold">-{s.negativeMarks ?? 0}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-semibold">
                        <td className="px-3 py-2">Total</td>
                        <td className="px-3 py-2 text-center">{instructionsTest.sections.reduce((a, s) => a + s.questions.length, 0)}</td>
                        <td className="px-3 py-2 text-center">{instructionsTest.duration}</td>
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rules */}
              <div className="space-y-2">
                <p className="font-semibold text-gray-800 flex items-center gap-1"><AlertCircle size={15} className="text-amber-500" /> Important Rules</p>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" /> Each section has its own timer. When time runs out, you are automatically moved to the next section.</li>
                  <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" /> You can move to the next section early using the <strong>Change Section</strong> button.</li>
                  <li className="flex items-start gap-2"><AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" /> <strong>Once you leave a section, you cannot go back.</strong> Unanswered questions will be left blank.</li>
                  <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" /> Switching tabs 3 times will auto-submit your test.</li>
                  <li className="flex items-start gap-2"><CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" /> You may attempt this test at most <strong>2 times</strong> (original + 1 retake).</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" onClick={() => setInstructionsTest(null)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleConfirmStart}>
                  I Understand — Start Test
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
