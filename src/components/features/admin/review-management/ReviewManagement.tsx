import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Star, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ReviewQuestion {
    id: string;
    text: string;
    type: string;
    isActive: boolean;
    createdAt?: string;
}

interface StudentReview {
    id: string;
    studentId: string;
    studentName: string;
    targetId: string;
    overallRating: number;
    comment: string;
    createdAt: string;
    answers?: Array<{ questionId: string; rating: number; questionText?: string }>;
}

export const ReviewManagement = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"targets" | "reviews">("targets");

    // Targets State
    const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<ReviewQuestion | null>(null);
    const [targetFormData, setTargetFormData] = useState({
        type: "",
        isActive: true
    });

    // Reviews State
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<StudentReview | null>(null);
    const [reviewFormData, setReviewFormData] = useState({
        overallRating: 5,
        comment: ""
    });

    // Fetch Targets
    const { data: questions = [], isLoading: isLoadingTargets } = useQuery<ReviewQuestion[]>({
        queryKey: ["review-questions"],
        queryFn: async () => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch("/api/reviews/questions", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch questions");
            return res.json();
        }
    });

    // Fetch Reviews
    const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<StudentReview[]>({
        queryKey: ["all-reviews"],
        queryFn: async () => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch("/api/reviews/public", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch reviews");
            return res.json();
        },
        enabled: activeTab === "reviews"
    });

    // Target Mutations
    const saveTargetMutation = useMutation({
        mutationFn: async (data: Partial<ReviewQuestion>) => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch("/api/reviews/questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to save question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["review-questions"] });
            toast.success("Target saved successfully");
            setIsTargetDialogOpen(false);
            setEditingQuestion(null);
            setTargetFormData({ type: "", isActive: true });
        }
    });

    const deleteTargetMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch(`/api/reviews/questions/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete question");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["review-questions"] });
            toast.success("Target deleted successfully");
        }
    });

    // Review Mutations
    const saveReviewMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<StudentReview> }) => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch(`/api/reviews/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update review");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
            queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
            toast.success("Review updated successfully");
            setIsReviewDialogOpen(false);
            setEditingReview(null);
        }
    });

    const deleteReviewMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = window.sessionStorage.getItem("token");
            const res = await fetch(`/api/reviews/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete review");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
            queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
            toast.success("Review deleted successfully");
        }
    });

    // Handlers
    const handleTargetSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetFormData.type) {
            toast.error("Target Type is required");
            return;
        }
        saveTargetMutation.mutate({
            ...(editingQuestion ? { id: editingQuestion.id } : {}),
            text: targetFormData.type,
            type: targetFormData.type,
            isActive: targetFormData.isActive
        });
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingReview) return;
        saveReviewMutation.mutate({
            id: editingReview.id,
            data: reviewFormData
        });
    };

    const openEditTarget = (q: ReviewQuestion) => {
        setEditingQuestion(q);
        setTargetFormData({ type: q.type, isActive: q.isActive !== false });
        setIsTargetDialogOpen(true);
    };

    const openNewTarget = () => {
        setEditingQuestion(null);
        setTargetFormData({ type: "", isActive: true });
        setIsTargetDialogOpen(true);
    };

    const openEditReview = (r: StudentReview) => {
        setEditingReview(r);
        setReviewFormData({ overallRating: r.overallRating || 0, comment: r.comment || "" });
        setIsReviewDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Review Management</h2>
                    <p className="text-sm text-gray-500">Create targets and manage student reviews.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab("targets")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "targets" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Target Dimensions
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "reviews" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        Student Reviews
                    </button>
                </div>
            </div>

            {activeTab === "targets" && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openNewTarget} className="bg-red-600 hover:bg-red-700 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Target
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingQuestion ? "Edit Target" : "New Target"}</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleTargetSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Target Type Criteria</label>
                                        <Input
                                            value={targetFormData.type}
                                            onChange={(e) => setTargetFormData({ ...targetFormData, type: e.target.value })}
                                            placeholder="e.g. Rate Test Difficulty, Class Ambience..."
                                        />
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <label className="text-sm font-medium">Is Active?</label>
                                        <Switch
                                            checked={targetFormData.isActive}
                                            onCheckedChange={(checked) => setTargetFormData({ ...targetFormData, isActive: checked })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={saveTargetMutation.isPending}>
                                        {saveTargetMutation.isPending ? "Saving..." : "Save Target"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                        {isLoadingTargets ? (
                            <div className="p-8 text-center text-gray-500">Loading targets...</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {questions.map((q) => (
                                    <li key={q.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                                        <div>
                                            <p className="font-medium text-gray-900 flex items-center gap-2">
                                                <Star className="w-4 h-4 text-orange-400" />
                                                {q.type}
                                            </p>
                                            <div className="flex gap-3 text-sm text-gray-500 mt-1">
                                                <span className={q.isActive !== false ? "text-green-600" : "text-gray-400"}>
                                                    {q.isActive !== false ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditTarget(q)}>
                                                <Pencil className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => {
                                                if (confirm("Are you sure you want to delete this target?")) {
                                                    deleteTargetMutation.mutate(q.id);
                                                }
                                            }}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                                {questions.length === 0 && (
                                    <li className="p-8 text-center text-gray-500">
                                        No target criteria found. Create some for students to review.
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "reviews" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                        {isLoadingReviews ? (
                            <div className="p-8 text-center text-gray-500">Loading reviews...</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {reviews.map((r) => (
                                    <li key={r.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-900">{r.studentName}</span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{r.targetId || "General"}</span>
                                            </div>
                                            <div className="flex gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3 h-3 ${i < r.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-gray-700 italic flex items-start gap-1 mb-3">
                                                <MessageSquareQuote className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
                                                "{r.comment}"
                                            </p>

                                            {r.answers && r.answers.length > 0 && (
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
                                                    {r.answers.map((ans: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                            <span>{ans.questionText}:</span>
                                                            <div className="flex gap-px">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} className={`w-2 h-2 ${i < ans.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Dialog open={isReviewDialogOpen && editingReview?.id === r.id} onOpenChange={(val) => {
                                                if (!val) setIsReviewDialogOpen(false)
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" onClick={() => openEditReview(r)}>
                                                        <Pencil className="w-4 h-4 text-blue-600 mr-2" /> Edit
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Student Review</DialogTitle>
                                                    </DialogHeader>
                                                    <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Overall Rating (1-5)</label>
                                                            <Input
                                                                type="number"
                                                                min={1} max={5}
                                                                value={reviewFormData.overallRating}
                                                                onChange={(e) => setReviewFormData({ ...reviewFormData, overallRating: parseInt(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Comment</label>
                                                            <Textarea
                                                                value={reviewFormData.comment}
                                                                onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                                                                rows={4}
                                                            />
                                                        </div>
                                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={saveReviewMutation.isPending}>
                                                            {saveReviewMutation.isPending ? "Saving..." : "Update Review"}
                                                        </Button>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>

                                            <Button variant="outline" size="sm" onClick={() => {
                                                if (confirm("Are you sure you want to delete this student review?")) {
                                                    deleteReviewMutation.mutate(r.id);
                                                }
                                            }}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                                {reviews.length === 0 && (
                                    <li className="p-8 text-center text-gray-500">
                                        No student reviews available yet.
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
