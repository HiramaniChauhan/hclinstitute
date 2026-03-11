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
import { Test, Question, TestSection } from "@/data/testData";
import { toast } from "sonner";

interface ChapterTestInterfaceProps {
    test: Test;
    onComplete: (results: any) => void;
    onCancel: () => void;
    reviewMode?: boolean;
    allAttempts?: any[];
}

export const ChapterTestInterface = ({ test, onComplete, onCancel, reviewMode = false, allAttempts = [] }: ChapterTestInterfaceProps) => {
    const storageKey = `chapterTestState_${test.id}`;

    // Initialize states from local storage if available, otherwise default
    const getInitialState = <T,>(key: string, defaultValue: T): T => {
        if (reviewMode) return defaultValue;
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed[key] !== undefined) {
                    if (key === 'visitedQuestions' || key === 'reviewQuestions') {
                        return new Set(parsed[key]) as unknown as T;
                    }
                    return parsed[key] as T;
                }
            }
        } catch (e) {
            console.error('Error parsing stored test state', e);
        }
        return defaultValue;
    };

    const [activeSectionIdx, setActiveSectionIdx] = useState(getInitialState('activeSectionIdx', 0));
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(getInitialState('activeQuestionIdx', 0));
    const [savedAnswers, setSavedAnswers] = useState<Record<string, number>>(getInitialState('savedAnswers', {}));
    const [draftAnswers, setDraftAnswers] = useState<Record<string, number>>(getInitialState('draftAnswers', {}));
    const [selectedAttemptIdx, setSelectedAttemptIdx] = useState<number>(
        allAttempts.length > 0 ? allAttempts.length - 1 : 0
    );
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // CBT State Tracking
    const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(getInitialState('visitedQuestions', new Set()));
    const [reviewQuestions, setReviewQuestions] = useState<Set<string>>(getInitialState('reviewQuestions', new Set()));

    const displayedAttempts = allAttempts.length <= 2 ? allAttempts : [allAttempts[0], allAttempts[allAttempts.length - 1]];
    const currentAttempt = allAttempts[selectedAttemptIdx] || {};

    const [startTime] = useState(Date.now());
    const [sectionTimers, setSectionTimers] = useState<Record<string, number>>(() => {
        const defaultTimers: Record<string, number> = {};
        test.sections.forEach(s => {
            defaultTimers[s.id] = s.duration * 60;
        });
        return getInitialState('sectionTimers', defaultTimers);
    });

    const activeSection = test.sections[activeSectionIdx];
    const activeQuestion = activeSection.questions[activeQuestionIdx];
    const questionKey = activeSection && activeQuestion ? `${activeSection.id}_${activeQuestion.id}` : null;

    // Persist to local storage whenever state changes
    useEffect(() => {
        if (!reviewMode) {
            const stateToSave = {
                activeSectionIdx,
                activeQuestionIdx,
                savedAnswers,
                draftAnswers,
                visitedQuestions: Array.from(visitedQuestions),
                reviewQuestions: Array.from(reviewQuestions),
                sectionTimers
            };
            localStorage.setItem(storageKey, JSON.stringify(stateToSave));
        }
    }, [activeSectionIdx, activeQuestionIdx, savedAnswers, draftAnswers, visitedQuestions, reviewQuestions, sectionTimers, reviewMode, storageKey]);

    // Populate answers for review
    useEffect(() => {
        if (reviewMode && currentAttempt.userAnswers) {
            setSavedAnswers(currentAttempt.userAnswers);
            setDraftAnswers(currentAttempt.userAnswers);
        }
    }, [reviewMode, currentAttempt]);

    // Track Visited
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
            const totalPossibleMarks = test.sections.reduce((acc, s) => acc + (s.questions.length * (Number(s.marksPerQuestion) || 1)), 0);

            let totalScore = 0;
            test.sections.forEach(section => {
                const marks = Number(section.marksPerQuestion) || 1;
                const negMarks = Number(section.negativeMarks) || 0;
                section.questions.forEach(q => {
                    const key = `${section.id}_${q.id}`;
                    const ans = savedAnswers[key];
                    if (ans !== undefined) {
                        if (Number(ans) === Number(q.correctAnswer)) totalScore += marks;
                        else totalScore -= negMarks;
                    }
                });
            });

            const results = {
                score: totalScore,
                totalMarks: totalPossibleMarks,
                userAnswers: savedAnswers
            };

            // Clear localStorage on submit
            localStorage.removeItem(storageKey);

            onComplete(results);
        } catch (error) {
            console.error("Submission error", error);
            toast.error("Error during submission");
        } finally {
            setIsSubmitting(false);
        }
    }, [test, savedAnswers, isSubmitting, onComplete, storageKey]);

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

    // Timer logic
    useEffect(() => {
        if (reviewMode || sectionTimers[activeSection.id] <= 0) return;
        const interval = setInterval(() => {
            setSectionTimers(prev => {
                const newVal = prev[activeSection.id] - 1;
                if (newVal <= 0) {
                    toast.warning(`Time's up for ${activeSection.name}!`);
                    if (activeSectionIdx < test.sections.length - 1) {
                        setActiveSectionIdx(prevIdx => prevIdx + 1);
                        setActiveQuestionIdx(0);
                    } else {
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
        if (activeQuestionIdx < activeSection.questions.length - 1) {
            setActiveQuestionIdx(prev => prev + 1);
        } else if (activeSectionIdx < test.sections.length - 1) {
            toast.info(`Moving to next section: ${test.sections[activeSectionIdx + 1].name}`);
            setActiveSectionIdx(prev => prev + 1);
            setActiveQuestionIdx(0);
        }
    };

    const handleSaveAndNext = () => {
        if (reviewMode) {
            moveToNextQuestion();
            return;
        }
        const draft = draftAnswers[questionKey];
        if (draft !== undefined) {
            setSavedAnswers(prev => ({ ...prev, [questionKey]: draft }));
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
        <div className="fixed inset-0 bg-white z-[200] overflow-y-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
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
                            {displayedAttempts.map((_, idx) => (
                                <Button
                                    key={idx}
                                    variant={selectedAttemptIdx === idx ? "default" : "ghost"}
                                    size="sm"
                                    className={`text-xs h-8 ${selectedAttemptIdx === idx ? 'bg-blue-600' : 'text-blue-600 hover:bg-blue-100'}`}
                                    onClick={() => setSelectedAttemptIdx(idx)}
                                >
                                    {idx === 0 ? "Original" : "Practice"} Attempt
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
                            <div className="flex items-center gap-2">
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
                                                    <span className="text-[10px] text-gray-400 font-bold">/ {sectionStats.totalPossible}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1.5 text-xs whitespace-nowrap ml-1">Review</Badge>
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
                                    <AlertDialogContent className="z-[250]">
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
                                                onClick={(e) => {
                                                    console.log("[ChapterTestInterface] Confirm Submission clicked");
                                                    handleSubmit(e as any);
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
                                    {activeQuestion.question}
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
                                                <span className="flex-1 text-xl font-medium text-slate-700">{option}</span>
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
                                            {activeQuestion.explanation}
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
                                        else if (activeSectionIdx > 0) {
                                            const prevSection = test.sections[activeSectionIdx - 1];
                                            setActiveSectionIdx(activeSectionIdx - 1);
                                            setActiveQuestionIdx(prevSection.questions.length - 1);
                                        }
                                    }}
                                    disabled={activeSectionIdx === 0 && activeQuestionIdx === 0}
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
                            </div>
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
                                    <div className="space-y-6">
                                        {test.sections.map((section, sIdx) => (
                                            <div key={section.id} className="space-y-3">
                                                <p className="text-xs font-bold text-slate-400 uppercase">{section.name}</p>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {section.questions.map((q, qIdx) => {
                                                        const key = `${section.id}_${q.id}`;
                                                        const isAnswered = savedAnswers[key] !== undefined;
                                                        const isVisited = visitedQuestions.has(key);
                                                        const isReview = reviewQuestions.has(key);
                                                        const isCurrent = activeSectionIdx === sIdx && activeQuestionIdx === qIdx;

                                                        // For Review mode, show correct/incorrect
                                                        const isCorrect = reviewMode && savedAnswers[key] !== undefined && savedAnswers[key] === q.correctAnswer;
                                                        const isWrong = reviewMode && isAnswered && savedAnswers[key] !== q.correctAnswer;

                                                        // CBT Color Mapping
                                                        let btnClass = 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'; // Not Visited

                                                        if (reviewMode) {
                                                            if (isCorrect) btnClass = 'bg-green-500 text-white border-green-600';
                                                            else if (isWrong) btnClass = 'bg-red-500 text-white border-red-600';
                                                            else btnClass = 'bg-slate-50 text-slate-400 border-slate-200';
                                                        } else {
                                                            if (isCurrent) btnClass = 'bg-blue-600 text-white border-blue-700 ring-4 ring-blue-100 scale-110 shadow-lg';
                                                            else if (isAnswered && isReview) btnClass = 'bg-purple-600 text-white border-purple-700 relative after:content-[""] after:w-2.5 after:h-2.5 after:bg-green-400 after:rounded-full after:absolute after:-bottom-1 after:-right-1 after:border-2 after:border-white after:z-10'; // Answered + Marked rules
                                                            else if (isReview) btnClass = 'bg-purple-600 text-white border-purple-700 shadow-md'; // Marked for Review
                                                            else if (isAnswered) btnClass = 'bg-green-500 text-white border-green-600 shadow-md'; // Answered
                                                            else if (isVisited) btnClass = 'bg-red-500 text-white border-red-600 shadow-sm'; // Visited but no answer
                                                        }

                                                        return (
                                                            <button
                                                                key={qIdx}
                                                                onClick={() => {
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
                                        ))}
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
            </div>
        </div>
    );
};
