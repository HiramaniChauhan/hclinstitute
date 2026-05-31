
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
import { Clock, ChevronLeft, ChevronRight, Save, Send, AlertCircle, Award, Trophy, ListOrdered, Target, X, PanelRightClose, PanelRightOpen, Loader2, Maximize } from "lucide-react";
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
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [showFullscreenPopup, setShowFullscreenPopup] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 1024) setIsPanelOpen(false);
            else setIsPanelOpen(true);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Measure scrollbar width to prevent layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        // Prevent background scrolling while test is active (iOS Safari requires html overflow lock too)
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, []);

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
        }
    }, [reviewMode, test.testId, test.id, test.totalMarks, allAttempts.length, initialAttemptIdx, selectedAttemptIdx]);

    // Populate saved answers if in review mode
    useEffect(() => {
        if (reviewMode) {
            const currentAttempt = allAttempts[selectedAttemptIdx] || { userAnswers: answers };
            if (currentAttempt && currentAttempt.userAnswers) {
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

            const resp = await fetch("/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentToken}`
                },
                body: JSON.stringify(results),
                keepalive: true // Ensure request completes even if page is closed/refreshed
            });

            if (resp.ok) {
                const savedResult = await resp.json();
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

    const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Anti-cheating: detect window switch, leave duration, and refresh/close
    useEffect(() => {
        if (reviewMode) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Tab switch count logic
                setTabSwitchCount(prev => {
                    const next = prev + 1;
                    if (next >= 3) {
                        toast.error("Suspicious activity detected! (3/3 tab switches). Auto-submitting test.");
                        handleSubmit();
                    } else {
                        toast.warning(`Warning: Please don't switch tabs/windows (${next}/3)`);
                    }
                    return next;
                });

                // Start 1 minute "Away" timer
                if (!leaveTimerRef.current) {
                    leaveTimerRef.current = setTimeout(() => {
                        toast.error("You have been away for more than 1 minute. Test auto-submitted.");
                        handleSubmit();
                    }, 60000);
                }
            } else {
                // Student returned - clear the 1-minute timer
                if (leaveTimerRef.current) {
                    clearTimeout(leaveTimerRef.current);
                    leaveTimerRef.current = null;
                }
            }
        };

        const handleBlur = () => {
            // Window lost focus (e.g., student clicked another app or window)
            if (!leaveTimerRef.current) {
                leaveTimerRef.current = setTimeout(() => {
                    toast.error("You left the test window for too long. Test auto-submitted.");
                    handleSubmit();
                }, 60000);
            }
        };

        const handleFocus = () => {
            // Student came back to the window
            if (leaveTimerRef.current) {
                clearTimeout(leaveTimerRef.current);
                leaveTimerRef.current = null;
            }
        };

        const handleBeforeUnload = () => {
            // Student is refreshing or closing the tab
            handleSubmit();
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
        };
    }, [reviewMode, handleSubmit]);

    // Fetch leaderboard data in review mode
    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!reviewMode) return;
            setLeaderboardLoading(true);
            try {
                const token = sessionStorage.getItem('token');
                const testId = test.testId || test.id;
                const resp = await fetch(`/api/results/leaderboard/${testId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setLeaderboardData(data.leaderboard || []);
                    setUserRank(data.userRank);
                    setTotalParticipants(data.totalParticipants);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            } finally {
                setLeaderboardLoading(false);
            }
        };

        fetchLeaderboard();
    }, [reviewMode, test.testId, test.id]);

    // Fullscreen logic — detect when student exits fullscreen and show popup
    const enterFullscreen = useCallback(() => {
        const element = document.documentElement;
        if (element.requestFullscreen) {
            element.requestFullscreen().then(() => {
                setShowFullscreenPopup(false);
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
    }, []);

    useEffect(() => {
        if (!reviewMode) {
            enterFullscreen();
        }

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !reviewMode) {
                setShowFullscreenPopup(true);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.error(`Error attempting to exit full-screen mode: ${err.message}`);
                });
            }
        };
    }, [reviewMode, enterFullscreen]);

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
        }
        moveToNextQuestion();
    };

    const handleMarkForReviewAndNext = () => {
        setReviewQuestions(prev => {
            const next = new Set(prev);
            next.add(questionKey);
            return next;
        });
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

    return createPortal(
        <div className="fixed inset-0 bg-slate-50 lg:bg-white z-[10000] overflow-hidden flex flex-col p-2 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* Fullscreen Exit Warning Popup */}
            {showFullscreenPopup && !reviewMode && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8 max-w-md w-[90vw] flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-slate-800">Fullscreen Required</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                You have exited fullscreen mode. The test must be taken in fullscreen to prevent unfair practices. Please return to fullscreen to continue.
                            </p>
                        </div>
                        <Button
                            onClick={enterFullscreen}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-base"
                        >
                            <Maximize size={20} />
                            Return to Fullscreen
                        </Button>
                    </div>
                </div>
            )}
            <div className="max-w-7xl w-full mx-auto h-full flex flex-col space-y-3 md:space-y-6">
                <div className={`flex-shrink-0 flex ${reviewMode ? 'flex-col sm:flex-row items-start sm:items-center flex-wrap gap-y-3' : 'items-center'} justify-between bg-white/90 backdrop-blur-md z-10 p-3 md:p-4 border-b rounded-xl shadow-sm mb-2 lg:mb-4`}>
                    <div className={reviewMode ? 'w-full sm:w-auto flex items-center justify-between' : ''}>
                        <h2 className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 truncate max-w-[150px] md:max-w-md">{test.title}</h2>
                        <div className="flex items-center gap-2 mt-1 hidden sm:flex">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{activeSection.name}</Badge>
                            <span className="text-sm text-gray-500 font-medium">Section {activeSectionIdx + 1} of {test.sections.length}</span>
                        </div>
                    </div>

                    {reviewMode && allAttempts.length > 1 && (
                        <div className="flex items-center gap-2 bg-blue-50/50 p-1 md:p-1.5 rounded-lg border border-blue-100">
                            {allAttempts.map((_, idx) => (
                                <Button
                                    key={idx}
                                    variant={selectedAttemptIdx === idx ? "default" : "ghost"}
                                    size="sm"
                                    className={`text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-4 ${selectedAttemptIdx === idx ? 'bg-blue-600' : 'text-blue-600 hover:bg-blue-100'}`}
                                    onClick={() => setSelectedAttemptIdx(idx)}
                                >
                                    <span className="hidden md:inline">{idx === 0 ? "Original" : "Retake"} Attempt</span>
                                    <span className="md:hidden">{idx === 0 ? "Orig" : "Retake"}</span>
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className={`flex flex-wrap items-center gap-2 md:gap-4 ${reviewMode ? 'justify-end w-full sm:w-auto' : ''}`}>
                        {!reviewMode ? (
                            <div className="flex items-center gap-2 md:gap-3">
                                {/* Change Section button - moved to header, left of clock */}
                                {activeSectionIdx < test.sections.length - 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleChangeSectionRequest}
                                        className="border-orange-400 text-orange-600 hover:bg-orange-50 font-bold px-3 md:px-5 text-xs md:text-sm h-9 md:h-10"
                                    >
                                        <span className="hidden sm:inline">Change Section</span><span className="sm:hidden">Next Sec</span> →
                                    </Button>
                                )}
                                <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-xl border-2 transition-colors ${sectionTimers[activeSection.id] < 60 ? 'border-red-500 text-red-600 animate-pulse bg-red-50' : 'border-blue-100 text-blue-700 bg-blue-50/50'}`}>
                                    <Clock size={16} className="md:w-5 md:h-5" />
                                    <span className="text-lg md:text-2xl font-mono font-bold">{formatTime(sectionTimers[activeSection.id])}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 md:gap-4">
                                {userRank && (
                                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border-amber-200 border text-amber-700">
                                        <Trophy size={20} className="text-amber-500" />
                                        <span className="font-bold whitespace-nowrap">Rank: #{userRank}</span>
                                    </div>
                                )}

                                {currentAttempt && sectionStats && (
                                    <>
                                        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-inner">
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-2.5 py-1 text-xs">{sectionStats.sections[activeSection.id]?.correct || 0} Correct</Badge>
                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 px-2.5 py-1 text-xs">{sectionStats.sections[activeSection.id]?.wrong || 0} Wrong</Badge>
                                        </div>
                                        <div className="flex items-center gap-1 md:gap-3 bg-white border border-blue-100 p-1 md:p-1.5 rounded-lg md:rounded-xl shadow-sm px-2 md:px-3">
                                            <div className={`p-1 rounded-lg ${selectedAttemptIdx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <Award size={14} className="md:w-4 md:h-4" />
                                            </div>
                                            <div className="flex flex-col justify-center">
                                                <p className="hidden md:block text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">
                                                    Total Score
                                                </p>
                                                <div className="flex items-baseline gap-0.5 md:gap-1 leading-none">
                                                    <span className="text-xs md:text-sm font-black text-blue-600 tabular-nums leading-none">{sectionStats.calculatedScore}</span>
                                                    <span className="text-[9px] md:text-[10px] text-gray-400 font-bold ml-1">/ {sectionStats.totalPossible}</span>
                                                    {(currentAttempt as any).duration !== undefined && (
                                                        <span className="hidden md:inline text-[10px] text-gray-400 font-bold ml-2">{(currentAttempt as any).duration}m</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 px-2 md:px-4">
                                            <ListOrdered size={18} className="md:mr-2" />
                                            <span className="hidden md:inline">Leaderboard</span>
                                            <span className="md:hidden">Ranks</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-[10001]">
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
                                                {leaderboardLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-12">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                                                <p className="text-sm text-gray-500 font-medium">Loading leaderboard data...</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : leaderboardData.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                                                            No results yet
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    leaderboardData.slice(0, 10).map((entry) => (
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
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </DialogContent>
                                </Dialog>

                                <Badge className="hidden md:inline-flex bg-green-100 text-green-700 border-green-200 px-4 py-2 text-sm whitespace-nowrap">Review Mode</Badge>
                            </div>
                        )}

                        <div className="flex items-center gap-1 md:gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsPanelOpen(!isPanelOpen)} className="mr-1 md:mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-slate-200 h-9 w-9 md:h-10 md:w-10 p-0">
                                {isPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                            </Button>
                            {reviewMode ? (
                                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 text-xs md:text-sm h-9 md:h-10 px-2 md:px-4" onClick={onCancel}>
                                    <X size={16} className="md:mr-2" />
                                    <span className="hidden md:inline">Exit Review</span>
                                </Button>
                            ) : (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 font-bold shadow-lg shadow-red-200 h-9 md:h-10 px-3 md:px-6 text-xs md:text-sm">
                                            <Send size={16} className="md:mr-2" />
                                            <span className="hidden md:inline">Submit Test</span><span className="md:hidden ml-1">Submit</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="z-[10001] w-[95vw] md:w-full">
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

                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start flex-1 min-h-0 w-full lg:overflow-hidden relative">
                    {/* Main Question Area */}
                    <div className="flex-1 w-full h-full flex flex-col min-h-0 space-y-4 lg:space-y-6">
                        <Card className="flex-1 shadow-2xl border-none bg-white flex flex-col overflow-hidden rounded-2xl ring-1 ring-slate-200">
                            <div className="bg-slate-50 p-2 md:p-3 flex flex-row items-center justify-between border-b flex-shrink-0">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Badge className="bg-slate-800 px-2 md:px-3 py-1 text-sm md:text-base">Q {activeQuestionIdx + 1}</Badge>
                                    <Badge variant="outline" className="text-slate-500 border-slate-300 hidden sm:inline-flex">{activeSection.name}</Badge>
                                </div>
                                {hasDraftChange && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-2 px-3 py-1 font-bold animate-pulse">
                                        <AlertCircle size={16} /> Unsaved Selection
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-8 space-y-8 flex-1 overflow-y-auto">
                                <div className="text-1xl font-semibold leading-relaxed text-slate-800">
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
                                        const isUnansweredCorrect = reviewMode && isCorrect && savedAnswers[questionKey] === undefined;
                                        const isAnsweredCorrect = isCorrect && !isUnansweredCorrect;

                                        return (
                                            <button
                                                key={idx}
                                                disabled={reviewMode}
                                                onClick={() => handleOptionSelect(idx)}
                                                className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-2xl border-[2px] md:border-[3px] text-left transition-all duration-300 group ${isAnsweredCorrect ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-100' :
                                                    isUnansweredCorrect ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-100' :
                                                        isUserWrong ? 'border-red-500 bg-red-100 shadow-md' :
                                                            isDraftSelected ? 'border-blue-600 bg-blue-50 shadow-lg translate-x-1 md:translate-x-3' :
                                                                'border-slate-100 hover:border-blue-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className={`w-6 h-6 md:w-8 md:h-8 text-sm md:text-xl rounded-lg md:rounded-xl flex items-center justify-center font-bold border-2 transition-colors ${isAnsweredCorrect ? 'bg-green-500 text-white border-green-600' :
                                                    isUnansweredCorrect ? 'bg-amber-500 text-white border-amber-600' :
                                                        isUserWrong ? 'bg-red-500 text-white border-red-600' :
                                                            isDraftSelected ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:border-blue-400 group-hover:text-blue-600 group-hover:bg-blue-50'
                                                    }`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <span className="flex-1 text-base md:text-lg font-medium text-slate-700 break-words overflow-x-hidden">
                                                    <Latex content={option} />
                                                </span>
                                                {isAnsweredCorrect && <Badge className="bg-green-600 text-white font-bold ml-auto px-4 py-1 text-sm">Correct</Badge>}
                                                {isUnansweredCorrect && <Badge className="bg-amber-500 text-white font-bold ml-auto px-2 md:px-4 py-1 text-[10px] md:text-sm whitespace-nowrap">Missed</Badge>}
                                                {isUserWrong && <Badge className="bg-red-600 text-white font-bold ml-auto px-4 py-1 text-sm">Your Answer</Badge>}
                                                {isSavedSelected && !reviewMode && isDraftSelected && (
                                                    <Badge className="bg-blue-600 text-white ml-auto px-4 py-1 text-sm">Saved</Badge>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {reviewMode && activeQuestion.explanation && (
                                    <div className="mt-8 p-2 bg-slate-900 text-white rounded-2xl space-y-2 border-l-8 border-l-blue-500">
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

                        <div className="flex-shrink-0 flex flex-wrap items-center justify-between p-2 md:p-4 bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 gap-2">
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    className="hover:bg-slate-100 font-bold px-2 md:px-4 h-9 md:h-12"
                                    onClick={() => {
                                        if (activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                                    }}
                                    disabled={activeQuestionIdx === 0}
                                >
                                    <ChevronLeft size={18} className="md:mr-2" /> <span className="hidden sm:inline">Previous</span>
                                </Button>
                            </div>

                            <div className="flex gap-2 ml-auto lg:hidden" />

                            <div className="flex gap-2">
                                {!reviewMode && (
                                    <Button variant="outline" onClick={handleClearResponse} className="text-slate-500 font-bold px-3 h-9 md:h-12 hover:bg-slate-50 text-xs md:text-sm">
                                        <span className="hidden sm:inline">Clear Response</span><span className="sm:hidden">Clear</span>
                                    </Button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 justify-end mt-1 lg:mt-0 ml-auto w-full lg:w-auto">
                                {!reviewMode && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={handleMarkForReviewAndNext}
                                            className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold px-3 text-xs md:text-sm h-9 md:h-12 flex-1 sm:flex-none whitespace-nowrap"
                                        >
                                            <span className="hidden sm:inline">Mark for Review & Next</span><span className="sm:hidden">Mark & Next</span>
                                        </Button>
                                        <Button
                                            onClick={handleSaveAndMarkForReview}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 text-xs md:text-sm h-9 md:h-12 flex-1 sm:flex-none whitespace-nowrap"
                                        >
                                            <span className="hidden sm:inline">Save & Mark For Review</span><span className="sm:hidden">Save & Review</span>
                                        </Button>
                                    </>
                                )}
                                <Button
                                    onClick={handleSaveAndNext}
                                    className="bg-blue-600 hover:bg-blue-700 px-4 md:px-6 text-sm md:text-xl font-bold rounded-xl shadow-md shadow-blue-200 transition-all hover:scale-105 active:scale-95 h-9 md:h-12 flex-1 sm:flex-none min-w-[100px]"
                                >
                                    {reviewMode ? "Next" : "Save & Next"}
                                    <ChevronRight size={18} className="ml-1 md:ml-2" />
                                </Button>

                            </div>

                            {/* Section change confirmation dialog */}
                            <AlertDialog open={showSectionChangeDialog} onOpenChange={setShowSectionChangeDialog}>
                                <AlertDialogContent className="z-[10001]">
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
                        <>
                            <div className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[10001] animate-in fade-in" onClick={() => setIsPanelOpen(false)} />
                            <div className="w-[85vw] sm:w-[320px] lg:w-80 flex-shrink-0 flex flex-col h-[100dvh] lg:h-full space-y-4 lg:space-y-6 pb-4 fixed right-0 top-0 lg:static z-[10002] lg:z-auto bg-slate-50 lg:bg-transparent shadow-2xl lg:shadow-none animate-in slide-in-from-right lg:animate-none p-3 lg:p-0">
                                <div className="flex justify-between items-center lg:hidden bg-white p-3 rounded-xl shadow-sm -mt-1 mx-1 border border-slate-100">
                                    <h3 className="font-bold text-slate-700">Question Palette</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setIsPanelOpen(false)} className="h-8 w-8 p-0">
                                        <X size={18} />
                                    </Button>
                                </div>
                                <Card className="border-none shadow-sm lg:shadow-xl bg-white lg:bg-slate-50/50 flex flex-col flex-1 min-h-0">
                                    <CardHeader className="p-2 lg:p-4 border-b flex-shrink-0 hidden lg:block">
                                        <CardTitle className="text-sm uppercase tracking-wider text-slate-500">Question Palette</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 lg:p-4 overflow-y-auto flex-1">
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
                                                                        className={`h-8 w-8 text-sm font-bold rounded-lg flex items-center justify-center border-2 transition-all transform active:scale-95 ${btnClass}`}
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

                                <Card className="bg-slate-900 text-white border-none shadow-xl flex-shrink-0">
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
                        </>
                    )}
                </div>
            </div >
        </div >,
        document.body
    );
};
