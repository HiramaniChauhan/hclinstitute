
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronLeft, ChevronRight, Save, Send, AlertCircle, Award, Trophy, ListOrdered, Target, X, PanelRightClose, PanelRightOpen } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Test, Question, TestSection } from "@/data/testData";
import { toast } from "sonner";
import { Latex } from "@/components/ui/latex";

interface TestInterfaceProps {
    test: Test;
    onComplete: (results: any) => void;
    onCancel: () => void;
    reviewMode?: boolean;
    answers?: Record<string, number>;
    allAttempts?: any[];
    initialAttemptIdx?: number;
}

export const TestInterface = ({ test, onComplete, onCancel, reviewMode = false, answers, allAttempts = [], initialAttemptIdx }: TestInterfaceProps) => {
    const [activeSectionIdx, setActiveSectionIdx] = useState(0);
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [savedAnswers, setSavedAnswers] = useState<Record<string, number>>({});
    const [draftAnswers, setDraftAnswers] = useState<Record<string, number>>({});
    const [userRank, setUserRank] = useState<number | null>(null);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(
        initialAttemptIdx !== undefined ? initialAttemptIdx : (allAttempts.length > 0 ? allAttempts.length - 1 : 0)
    );
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
    const [showSectionChangeDialog, setShowSectionChangeDialog] = useState(false);

    // CBT State Tracking
    const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
    const [reviewQuestions, setReviewQuestions] = useState<Set<string>>(new Set());

    // Filter displayed attempts to at most 2 (Original + Latest Practice) for UI consistency
    const displayedAttempts = allAttempts.length <= 2 ? allAttempts : [allAttempts[0], allAttempts[allAttempts.length - 1]];

    // The current attempt shown in the header summary
    const currentAttempt = allAttempts[selectedAttemptIdx] || { userAnswers: answers };

    const [startTime] = useState(Date.now());
    const [sectionTimers, setSectionTimers] = useState<Record<string, number>>(() => {
        const timers: Record<string, number> = {};
        test.sections.forEach(s => {
            timers[s.id] = s.duration * 60;
        });
        return timers;
    });

    useEffect(() => {
        if (reviewMode) {
            console.log("[TestInterface] Review Mode initialized:", {
                testId: test.testId || test.id,
                totalMarks: test.totalMarks,
                attemptsCount: allAttempts.length,
                initialIdx: initialAttemptIdx,
                selectedIdx: selectedAttemptIdx
            });
        }
    }, [reviewMode, test.testId, test.id, test.totalMarks, allAttempts.length, initialAttemptIdx, selectedAttemptIdx]);

    // Populate saved answers if in review mode
    useEffect(() => {
        if (reviewMode) {
            const currentAttempt = allAttempts[selectedAttemptIdx] || { userAnswers: answers };
            if (currentAttempt && currentAttempt.userAnswers) {
                console.log("[TestInterface] Populating answers for review (Attempt index:", selectedAttemptIdx, "):", currentAttempt.userAnswers);
                setSavedAnswers(currentAttempt.userAnswers);
                setDraftAnswers(currentAttempt.userAnswers);
            }
        }
    }, [reviewMode, answers, allAttempts, selectedAttemptIdx]);

    const activeSection = test.sections[activeSectionIdx];
    const activeQuestion = activeSection.questions[activeQuestionIdx];
    const questionKey = `${activeSection.id}_${activeQuestion.id}`;

    // Auto-mark the current question as visited
    useEffect(() => {
        if (!reviewMode && questionKey) {
            setVisitedQuestions(prev => {
                const updated = new Set(prev);
                updated.add(questionKey);
                return updated;
            });
        }
    }, [activeSectionIdx, activeQuestionIdx, questionKey, reviewMode]);

    const handleSubmit = useCallback(async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isSubmitting) return;

        console.log("[TestInterface] handleSubmit triggered", { tabSwitchCount });
        setIsSubmitting(true);
        try {
            const currentToken = sessionStorage.getItem('token');
            if (!currentToken) {
                toast.error("Auth token missing. Please sign in again.");
                setIsSubmitting(false);
                return;
            }

            const totalQuestions = test.sections.reduce((acc, s) => acc + s.questions.length, 0);

            let totalScore = 0;
            let correctCount = 0;
            let incorrectCount = 0;

            console.log("[TestInterface] Calculating scores...");
            test.sections.forEach(section => {
                const marks = Number(section.marksPerQuestion) || 1;
                const negMarks = Number(section.negativeMarks) || 0;

                section.questions.forEach(q => {
                    const key = `${section.id}_${q.id}`;
                    const userAnswer = savedAnswers[key];
                    if (userAnswer !== undefined && userAnswer !== null) {
                        if (Number(userAnswer) === Number(q.correctAnswer)) {
                            correctCount++;
                            totalScore += marks;
                        } else {
                            incorrectCount++;
                            totalScore -= negMarks;
                        }
                    }
                });
            });

            const totalPossibleMarks = test.sections.reduce((acc, s) => acc + (s.questions.length * (Number(s.marksPerQuestion) || 1)), 0);

            const results = {
                testId: test.testId || test.id,
                courseId: test.subject || "General",
                score: totalScore,
                totalQuestions,
                correctAnswers: correctCount,
                incorrectAnswers: incorrectCount,
                percentage: totalPossibleMarks > 0 ? (totalScore / totalPossibleMarks) * 100 : 0,
                duration: Math.floor((Date.now() - startTime) / 60000), // convert ms to minutes
                submittedAt: new Date().toISOString(),
                userAnswers: savedAnswers
            };

            console.log("[TestInterface] Submitting results:", results);
            const resp = await fetch("/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentToken}`
                },
                body: JSON.stringify(results)
            });

            if (resp.ok) {
                const savedResult = await resp.json();
                console.log("[TestInterface] Result saved successfully:", savedResult);
                toast.success("Test submitted successfully!");
                onComplete(results);
            } else {
                const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
                console.error("[TestInterface] Failed to submit results:", errorData);
                toast.error(`Submission failed: ${errorData.error || "Please try again."}`);
            }
        } catch (error: any) {
            console.error("[TestInterface] Error in handleSubmit:", error);
            toast.error("Network error while submitting results.");
        } finally {
            setIsSubmitting(false);
        }
    }, [test, savedAnswers, tabSwitchCount, onComplete, isSubmitting, startTime]);

    // Anti-cheating: detect window switch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !reviewMode) {
                setTabSwitchCount(prev => {
                    const next = prev + 1;
                    if (next >= 3) {
                        toast.error("Suspicious activity detected! Auto-submitting test.");
                        handleSubmit();
                    } else {
                        toast.warning(`Warning: Please don't switch tabs/windows (${next}/3)`);
                    }
                    return next;
                });
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [reviewMode, handleSubmit]);

    // Fetch leaderboard data in review mode
    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!reviewMode) return;
            try {
                const token = sessionStorage.getItem('token');
                const testId = test.testId || test.id;
                const resp = await fetch(`/api/results/leaderboard/${testId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setLeaderboardData(data.leaderboard);
                    setUserRank(data.userRank);
                    setTotalParticipants(data.totalParticipants);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            }
        };

        fetchLeaderboard();
    }, [reviewMode, test.testId, test.id]);

    // Fullscreen logic
    useEffect(() => {
        if (!reviewMode) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            }
        }

        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.error(`Error attempting to exit full-screen mode: ${err.message}`);
                });
            }
        };
    }, [reviewMode]);

    // Timer logic - only run if not in review mode
    useEffect(() => {
        if (reviewMode || sectionTimers[activeSection.id] <= 0) return;

        const interval = setInterval(() => {
            setSectionTimers(prev => {
                const newVal = prev[activeSection.id] - 1;
                if (newVal <= 0) {
                    toast.warning(`Time's up for ${activeSection.name}! Moving to next section.`);
                    // Auto-advance to next section when time runs out
                    if (activeSectionIdx < test.sections.length - 1) {
                        setCompletedSections(prev => { const n = new Set(prev); n.add(activeSectionIdx); return n; });
                        setActiveSectionIdx(prevIdx => prevIdx + 1);
                        setActiveQuestionIdx(0);
                    } else {
                        // Last section, auto-submit
                        toast.error("Time's up for the last section! Submitting now.");
                        handleSubmit();
                    }
                }
                return { ...prev, [activeSection.id]: newVal };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [activeSection.id, activeSectionIdx, test.sections.length, reviewMode, handleSubmit]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (optionIdx: number) => {
        if (reviewMode) return;
        setDraftAnswers(prev => ({
            ...prev,
            [questionKey]: optionIdx
        }));
    };

    const moveToNextQuestion = () => {
        // Only moves within the current section - NO auto section jumping
        if (activeQuestionIdx < activeSection.questions.length - 1) {
            setActiveQuestionIdx(prev => prev + 1);
        }
    };

    const handleChangeSectionRequest = () => {
        if (activeSectionIdx >= test.sections.length - 1) return; // no next section
        setShowSectionChangeDialog(true);
    };

    const handleConfirmSectionChange = () => {
        setCompletedSections(prev => { const n = new Set(prev); n.add(activeSectionIdx); return n; });
        setActiveSectionIdx(prev => prev + 1);
        setActiveQuestionIdx(0);
        setShowSectionChangeDialog(false);
        toast.info(`Moved to section: ${test.sections[activeSectionIdx + 1].name}`);
    };

    const handleSaveAndNext = () => {
        if (reviewMode) {
            moveToNextQuestion();
            return;
        }

        const draft = draftAnswers[questionKey];
        if (draft !== undefined) {
            setSavedAnswers(prev => ({ ...prev, [questionKey]: draft }));

            // Saving explicitly clears the review flag
            setReviewQuestions(prev => {
                const next = new Set(prev);
                next.delete(questionKey);
                return next;
            });
            toast.success("Answer saved", { duration: 1000 });
        }
        moveToNextQuestion();
    };

    const handleSaveAndMarkForReview = () => {
        const draft = draftAnswers[questionKey];
        if (draft !== undefined) {
            setSavedAnswers(prev => ({ ...prev, [questionKey]: draft }));
            setReviewQuestions(prev => {
                const next = new Set(prev);
                next.add(questionKey);
                return next;
            });
            toast.success("Answer saved & marked for review", { duration: 1000 });
        }
        moveToNextQuestion();
    };

    const handleMarkForReviewAndNext = () => {
        setReviewQuestions(prev => {
            const next = new Set(prev);
            next.add(questionKey);
            return next;
        });
        toast.info("Marked for review", { duration: 1000 });
        moveToNextQuestion();
    };

    const handleClearResponse = () => {
        setSavedAnswers(prev => {
            const next = { ...prev };
            delete next[questionKey];
            return next;
        });
        setDraftAnswers(prev => {
            const next = { ...prev };
            delete next[questionKey];
            return next;
        });
    };


    const isSaved = savedAnswers[questionKey] !== undefined && savedAnswers[questionKey] === draftAnswers[questionKey];
    const hasDraftChange = !reviewMode && draftAnswers[questionKey] !== undefined && savedAnswers[questionKey] !== draftAnswers[questionKey];

    const sectionStats = useMemo(() => {
        if (!reviewMode || !currentAttempt) return null;
        let totalCorrect = 0;
        let totalWrong = 0;
        let totalUnanswered = 0;
        let calculatedScore = 0;
        let totalPossible = test.sections.reduce((acc, s) => acc + (s.questions.length * (Number(s.marksPerQuestion) || 1)), 0);

        const stats: Record<string, { correct: number, wrong: number, unanswered: number }> = {};

        test.sections.forEach(sec => {
            let sc = 0;
            let sw = 0;
            let su = 0;
            const marks = Number(sec.marksPerQuestion) || 1;
            const negMarks = Number(sec.negativeMarks) || 0;

            sec.questions.forEach(q => {
                const key = `${sec.id}_${q.id}`;
                const ans = savedAnswers[key];
                if (ans === undefined || ans === null) {
                    su++;
                } else if (Number(ans) === Number(q.correctAnswer)) {
                    sc++;
                } else {
                    sw++;
                }
            });
            stats[sec.id] = { correct: sc, wrong: sw, unanswered: su };
            totalCorrect += sc;
            totalWrong += sw;
            totalUnanswered += su;
            calculatedScore += (sc * marks) - (sw * negMarks);
        });

        return { sections: stats, totalCorrect, totalWrong, totalUnanswered, totalPossible, calculatedScore };
    }, [reviewMode, currentAttempt, savedAnswers, test.sections]);

    return (
        <div className="fixed inset-0 bg-white z-[40] overflow-y-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 p-4 border-b rounded-t-xl mb-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{test.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{activeSection.name}</Badge>
                            <span className="text-sm text-gray-500 font-medium">Section {activeSectionIdx + 1} of {test.sections.length}</span>
                        </div>
                    </div>

                    {reviewMode && allAttempts.length > 1 && (
                        <div className="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                            {allAttempts.map((_, idx) => (
                                <Button
                                    key={idx}
                                    variant={selectedAttemptIdx === idx ? "default" : "ghost"}
                                    size="sm"
                                    className={`text-xs h-8 ${selectedAttemptIdx === idx ? 'bg-blue-600' : 'text-blue-600 hover:bg-blue-100'}`}
                                    onClick={() => setSelectedAttemptIdx(idx)}
                                >
                                    {idx === 0 ? "Original" : "Retake"} Attempt
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        {!reviewMode ? (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-colors ${sectionTimers[activeSection.id] < 60 ? 'border-red-500 text-red-600 animate-pulse bg-red-50' : 'border-blue-100 text-blue-700 bg-blue-50/50'}`}>
                                <Clock size={20} />
                                <span className="text-2xl font-mono font-bold">{formatTime(sectionTimers[activeSection.id])}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                {userRank && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border-amber-200 border text-amber-700">
                                        <Trophy size={20} className="text-amber-500" />
                                        <span className="font-bold whitespace-nowrap">Rank: #{userRank}</span>
                                    </div>
                                )}

                                {currentAttempt && sectionStats && (
                                    <>
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-inner">
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-2.5 py-1 text-xs">{sectionStats.sections[activeSection.id]?.correct || 0} Correct</Badge>
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 px-2.5 py-1 text-xs">{sectionStats.sections[activeSection.id]?.wrong || 0} Wrong</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white border border-blue-100 p-1.5 rounded-xl shadow-sm px-3">
                                            <div className={`p-1 rounded-lg ${selectedAttemptIdx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <Award size={16} />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">
                                                    Total Score
                                                </p>
                                                <div className="flex items-baseline gap-1 leading-none">
                                                    <span className="text-sm font-black text-blue-600 tabular-nums leading-none">{sectionStats.calculatedScore}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold ml-1">/ {sectionStats.totalPossible}</span>
                                                    {(currentAttempt as any).duration !== undefined && (
                                                        <span className="text-[10px] text-gray-400 font-bold ml-2">{(currentAttempt as any).duration}m</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                            <ListOrdered size={18} className="mr-2" />
                                            Leaderboard
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                                <Trophy className="text-amber-500" />
                                                Leaderboard
                                            </DialogTitle>
                                            <DialogDescription>
                                                Top performers for {test.title} ({totalParticipants} participants)
                                            </DialogDescription>
                                        </DialogHeader>

                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-20 font-bold">Rank</TableHead>
                                                    <TableHead className="font-bold">Student Name</TableHead>
                                                    <TableHead className="text-right font-bold">Score</TableHead>
                                                    <TableHead className="text-right font-bold">Percentage</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {leaderboardData.map((entry) => (
                                                    <TableRow key={entry.userId} className={entry.isCurrentUser ? "bg-blue-50" : ""}>
                                                        <TableCell className="font-medium flex items-center gap-2">
                                                            {entry.rank === 1 && "🥇"}
                                                            {entry.rank === 2 && "🥈"}
                                                            {entry.rank === 3 && "🥉"}
                                                            {entry.rank}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {entry.name}
                                                            {entry.isCurrentUser && <Badge className="ml-2 bg-blue-100 text-blue-700">You</Badge>}
                                                        </TableCell>
                                                        <TableCell className="text-right">{entry.score}</TableCell>
                                                        <TableCell className="text-right">{entry.percentage}%</TableCell>
                                                    </TableRow>
                                                ))}
                                                {leaderboardData.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                                                            No results yet
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </DialogContent>
                                </Dialog>

                                <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2 text-sm whitespace-nowrap">Review Mode</Badge>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setIsPanelOpen(!isPanelOpen)} className="mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-slate-200">
                                {isPanelOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                            </Button>
                            {reviewMode ? (
                                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={onCancel}>
                                    <X size={18} className="mr-2" />
                                    Exit Review
                                </Button>
                            ) : (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="lg" className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 font-bold shadow-lg shadow-red-200">
                                            <Send size={18} className="mr-2" />
                                            Submit Test
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                You have answered {Object.keys(savedAnswers).length} out of {test.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions.
                                                Once submitted, you cannot change your answers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Review Answers</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => {
                                                    console.log("[TestInterface] Confirm Submission clicked");
                                                    handleSubmit();
                                                }}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Confirm Submission
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Main Question Area */}
                    <div className="flex-1 w-full space-y-6">
                        <Card className="min-h-[500px] shadow-2xl border-none bg-white overflow-hidden rounded-2xl ring-1 ring-slate-200">
                            <div className="bg-slate-50 p-6 flex flex-row items-center justify-between border-b">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-slate-800 px-4 py-1 text-base">Question {activeQuestionIdx + 1}</Badge>
                                    <Badge variant="outline" className="text-slate-500 border-slate-300">{activeSection.name}</Badge>
                                </div>
                                {hasDraftChange && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-2 px-3 py-1 font-bold animate-pulse">
                                        <AlertCircle size={16} /> Unsaved Selection
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-8 space-y-8">
                                <div className="text-3xl font-semibold leading-relaxed text-slate-800">
                                    <Latex content={activeQuestion.question} />
                                </div>

                                {activeQuestion.image && (
                                    <div className="my-6 rounded-2xl overflow-hidden shadow-md border-4 border-white bg-white">
                                        <img src={activeQuestion.image} alt="Question" className="max-h-[350px] object-contain mx-auto" />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-4 mt-8">
                                    {activeQuestion.options.map((option, idx) => {
                                        const isDraftSelected = draftAnswers[questionKey] !== undefined && Number(draftAnswers[questionKey]) === idx;
                                        const isSavedSelected = savedAnswers[questionKey] !== undefined && Number(savedAnswers[questionKey]) === idx;
                                        const isCorrect = reviewMode && Number(activeQuestion.correctAnswer) === idx;
                                        const isUserWrong = reviewMode && isSavedSelected && !isCorrect;

                                        return (
                                            <button
                                                key={idx}
                                                disabled={reviewMode}
                                                onClick={() => handleOptionSelect(idx)}
                                                className={`flex items-center gap-5 p-6 rounded-2xl border-[3px] text-left transition-all duration-300 group ${isCorrect ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-100' :
                                                    isUserWrong ? 'border-red-500 bg-red-100 shadow-md' :
                                                        isDraftSelected ? 'border-blue-600 bg-blue-50 shadow-lg translate-x-3' :
                                                            'border-slate-100 hover:border-blue-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className={`w-12 h-12 text-xl rounded-xl flex items-center justify-center font-bold border-2 transition-colors ${isCorrect ? 'bg-green-500 text-white border-green-600' :
                                                    isUserWrong ? 'bg-red-500 text-white border-red-600' :
                                                        isDraftSelected ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:border-blue-400 group-hover:text-blue-600 group-hover:bg-blue-50'
                                                    }`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className="flex-1 text-xl font-medium text-slate-700">
                                                    <Latex content={option} />
                                                </span>
                                                {isCorrect && <Badge className="bg-green-600 text-white font-bold ml-auto px-4 py-1 text-sm">Correct</Badge>}
                                                {isUserWrong && <Badge className="bg-red-600 text-white font-bold ml-auto px-4 py-1 text-sm">Your Answer</Badge>}
                                                {isSavedSelected && !reviewMode && isDraftSelected && (
                                                    <Badge className="bg-blue-600 text-white ml-auto px-4 py-1 text-sm">Saved</Badge>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {reviewMode && activeQuestion.explanation && (
                                    <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl space-y-2 border-l-8 border-l-blue-500">
                                        <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-sm">
                                            <Award size={18} />
                                            Explanation
                                        </div>
                                        <p className="text-xl leading-relaxed text-slate-300">
                                            <Latex content={activeQuestion.explanation || ''} />
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-xl ring-1 ring-slate-200">
                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="hover:bg-slate-100 font-bold px-6"
                                    onClick={() => {
                                        if (activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                                        // Prevent going back to a completed section
                                    }}
                                    disabled={activeQuestionIdx === 0}
                                >
                                    <ChevronLeft size={24} className="mr-2" /> Previous
                                </Button>
                            </div>

                            <div className="flex gap-4">
                                {!reviewMode && (
                                    <Button variant="outline" size="lg" onClick={handleClearResponse} className="text-slate-500 font-bold px-6 hover:bg-slate-50">
                                        Clear Response
                                    </Button>
                                )}
                            </div>

                            <div className="flex gap-3">
                                {!reviewMode && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={handleMarkForReviewAndNext}
                                            className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold px-6"
                                        >
                                            Mark for Review & Next
                                        </Button>
                                        <Button
                                            size="lg"
                                            onClick={handleSaveAndMarkForReview}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                                        >
                                            Save & Mark For Review
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="lg"
                                    onClick={handleSaveAndNext}
                                    className="bg-blue-600 hover:bg-blue-700 px-10 text-xl font-bold rounded-2xl shadow-md shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                                >
                                    {reviewMode ? "Next" : "Save & Next"}
                                    <ChevronRight size={20} className="ml-2" />
                                </Button>
                                {/* Change Section button - only shown in exam mode when more sections remain */}
                                {!reviewMode && activeSectionIdx < test.sections.length - 1 && (
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleChangeSectionRequest}
                                        className="border-orange-400 text-orange-600 hover:bg-orange-50 font-bold px-6"
                                    >
                                        Change Section →
                                    </Button>
                                )}
                            </div>

                            {/* Section change confirmation dialog */}
                            <AlertDialog open={showSectionChangeDialog} onOpenChange={setShowSectionChangeDialog}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Change Section?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            <strong>Warning:</strong> Once you move to section <strong>{activeSectionIdx + 1 < test.sections.length ? test.sections[activeSectionIdx + 1].name : ''}</strong>, you <strong>cannot return</strong> to the current section (<strong>{activeSection.name}</strong>). Any unanswered questions in this section will be left blank.
                                            <br /><br />
                                            Are you sure you want to proceed?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Stay in Current Section</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleConfirmSectionChange}
                                            className="bg-orange-600 hover:bg-orange-700"
                                        >
                                            Yes, Move to Next Section
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    {/* Sidebar Navigation */}
                    {isPanelOpen && (
                        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto space-y-6 pb-20">
                            <Card className="border-none shadow-xl bg-slate-50/50">
                                <CardHeader className="p-4 border-b">
                                    <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Question Palette</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-4">
                                        {/* In review mode show all sections, in live mode show only the active one */}
                                        {(reviewMode ? test.sections : [test.sections[activeSectionIdx]]).map((section, loopIdx) => {
                                            const sIdx = reviewMode ? loopIdx : activeSectionIdx;
                                            return (
                                                <div key={section.id} className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-bold text-slate-400 uppercase">
                                                            {section.name}
                                                            <span className="ml-1 text-slate-300 font-normal normal-case">({section.questions.length} Q)</span>
                                                        </p>
                                                        {!reviewMode && completedSections.has(sIdx) && (
                                                            <span className="text-[10px] text-red-400 font-bold uppercase">Locked</span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {section.questions.map((q, qIdx) => {
                                                            const key = `${section.id}_${q.id}`;
                                                            const isAnswered = savedAnswers[key] !== undefined;
                                                            const isVisited = visitedQuestions.has(key);
                                                            const isReview = reviewQuestions.has(key);
                                                            const isCurrent = activeSectionIdx === sIdx && activeQuestionIdx === qIdx;
                                                            const isSectionLocked = !reviewMode && completedSections.has(sIdx);

                                                            // For Review mode, show correct/incorrect
                                                            const isCorrect = reviewMode && savedAnswers[key] !== undefined && savedAnswers[key] == q.correctAnswer;
                                                            const isWrong = reviewMode && isAnswered && savedAnswers[key] != q.correctAnswer;

                                                            // CBT Color Mapping
                                                            let btnClass = 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'; // Not Visited

                                                            if (isSectionLocked) {
                                                                if (isAnswered) btnClass = 'bg-green-200 text-green-600 border-green-300 opacity-60 cursor-not-allowed';
                                                                else btnClass = 'bg-slate-100 text-slate-300 border-slate-200 opacity-60 cursor-not-allowed';
                                                            } else if (reviewMode) {
                                                                if (isCorrect) btnClass = 'bg-green-500 text-white border-green-600';
                                                                else if (isWrong) btnClass = 'bg-red-500 text-white border-red-600';
                                                                else btnClass = 'bg-slate-50 text-slate-400 border-slate-200';
                                                            } else {
                                                                if (isCurrent) btnClass = 'bg-blue-600 text-white border-blue-700 ring-4 ring-blue-100 scale-110 shadow-lg';
                                                                else if (isAnswered && isReview) btnClass = 'bg-purple-600 text-white border-purple-700 relative after:content-[""] after:w-2.5 after:h-2.5 after:bg-green-400 after:rounded-full after:absolute after:-bottom-1 after:-right-1 after:border-2 after:border-white after:z-10';
                                                                else if (isReview) btnClass = 'bg-purple-600 text-white border-purple-700 shadow-md';
                                                                else if (isAnswered) btnClass = 'bg-green-500 text-white border-green-600 shadow-md';
                                                                else if (isVisited) btnClass = 'bg-red-500 text-white border-red-600 shadow-sm';
                                                            }

                                                            return (
                                                                <button
                                                                    key={qIdx}
                                                                    disabled={isSectionLocked}
                                                                    onClick={() => {
                                                                        if (isSectionLocked) return;
                                                                        setActiveSectionIdx(sIdx);
                                                                        setActiveQuestionIdx(qIdx);
                                                                    }}
                                                                    className={`h-10 w-10 text-sm font-bold rounded-lg flex items-center justify-center border-2 transition-all transform active:scale-95 ${btnClass}`}
                                                                >
                                                                    {qIdx + 1}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Section tabs at bottom — give overview of all sections */}
                                        {!reviewMode && test.sections.length > 1 && (
                                            <div className="pt-3 border-t">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">All Sections</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {test.sections.map((s, sIdx) => (
                                                        <span key={s.id} className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${activeSectionIdx === sIdx
                                                            ? 'bg-blue-600 text-white border-blue-700'
                                                            : completedSections.has(sIdx)
                                                                ? 'bg-red-100 text-red-600 border-red-200'
                                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                                            }`}>
                                                            {sIdx + 1}. {s.name}
                                                            {completedSections.has(sIdx) ? ' 🔒' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900 text-white border-none shadow-xl">
                                <CardContent className="p-4 text-xs space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded bg-blue-600"></div>
                                        <span>Current Question</span>
                                    </div>
                                    {!reviewMode ? (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-green-500 border border-green-600"></div>
                                                <span>Answered</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-red-500 border border-red-600"></div>
                                                <span>Not Answered</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-white border border-slate-300"></div>
                                                <span>Not Visited</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-purple-600 border border-purple-700"></div>
                                                <span>Marked for Review</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-purple-600 border border-purple-700 relative flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full absolute -bottom-0.5 -right-0.5 border border-white"></div>
                                                </div>
                                                <span className="leading-tight">Answered & Marked<br /><span className="text-[9px] text-gray-400">(Will be considered for evaluation)</span></span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-green-500"></div>
                                                <span>Correct Answer</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded bg-red-500"></div>
                                                <span>Incorrect Answer</span>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                    )}
                </div>
            </div >
        </div >
    );
};
