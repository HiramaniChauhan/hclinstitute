import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ReviewQuestion {
    id: string;
    text: string;
    type: string;
    isActive: boolean;
}

export const GiveReview = () => {
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [overallRating, setOverallRating] = useState<number>(0);
    const [comment, setComment] = useState("");

    const { data: questions = [], isLoading: isLoadingQuestions, error } = useQuery<ReviewQuestion[]>({
        queryKey: ["review-questions-student"],
        queryFn: async () => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch("/api/reviews/questions", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 403) throw new Error("NOT_ENROLLED");
            if (!res.ok) throw new Error("Failed to fetch questions");
            return res.json();
        },
        retry: (failureCount, err) => err.message !== "NOT_ENROLLED" && failureCount < 3
    });

    const { data: myReview, isLoading: isLoadingReview } = useQuery({
        queryKey: ["my-review"],
        queryFn: async () => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch("/api/reviews/mine", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch my review");
            return res.json();
        }
    });

    useEffect(() => {
        if (myReview) {
            setOverallRating(myReview.overallRating || 0);
            setComment(myReview.comment || "");
            if (myReview.answers) {
                const prefilled: Record<string, number> = {};
                myReview.answers.forEach((ans: any) => {
                    prefilled[ans.questionId] = ans.rating;
                });
                setAnswers(prefilled);
            }
        }
    }, [myReview]);

    const submitMutation = useMutation({
        mutationFn: async (payload: any) => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to submit review");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Review submitted successfully! Thank you.");
            setAnswers({});
            setOverallRating(0);
            setComment("");
        },
        onError: () => {
            toast.error("Failed to submit review. Please try again.");
        }
    });

    const handleRating = (questionId: string, rating: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: rating }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (overallRating === 0) {
            toast.error("Please provide an overall rating");
            return;
        }

        // Map answers to array only for active questions
        const answersArray = questions.map((q) => ({
            questionId: q.id,
            rating: answers[q.id] || 0
        }));

        if (answersArray.some(a => a.rating === 0)) {
            toast.error("Please provide a rating for all criteria");
            return;
        }

        submitMutation.mutate({
            targetId: "Institute",
            targetType: "general",
            answers: answersArray,
            overallRating,
            comment
        });
    };

    const StarRating = ({ rating, onChange }: { rating: number, onChange: (rating: number) => void }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className={`focus:outline-none transition-colors ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                >
                    <Star className="w-6 h-6 fill-current" />
                </button>
            ))}
        </div>
    );

    if (error?.message === "NOT_ENROLLED") {
        return (
            <div className="max-w-2xl mx-auto space-y-6 text-center py-16">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-red-100 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <Star className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Required</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        You must be actively registered in at least one course to submit a review for the institute.
                    </p>
                </div>
            </div>
        );
    }

    if (isLoadingQuestions || isLoadingReview) return <div>Loading data...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Give Feedback</h2>
                <p className="text-sm text-gray-500">Your reviews help us improve our world-class curriculum.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {questions.length > 0 ? (
                        <div className="space-y-6">
                            {questions.map((q) => (
                                <div key={q.id} className="space-y-2 border-b pb-4 last:border-0 last:pb-0">
                                    <label className="text-sm font-medium">{q.type}</label>
                                    <StarRating
                                        rating={answers[q.id] || 0}
                                        onChange={(r) => handleRating(q.id, r)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No specific targets provided. Please leave an overall rating.</p>
                    )}

                    <hr className="my-4" />

                    <div className="space-y-2">
                        <label className="text-md font-bold text-gray-900 border-l-4 border-blue-600 pl-2">Overall Rating</label>
                        <StarRating rating={overallRating} onChange={setOverallRating} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Additional Comments (Optional)</label>
                        <Textarea
                            placeholder="Tell us more about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none"
                            rows={4}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={submitMutation.isPending}
                    >
                        {submitMutation.isPending ? "Submitting..." : (myReview ? "Update Submited Review" : "Submit Review")}
                    </Button>
                </form>
            </div>
        </div>
    );
};
