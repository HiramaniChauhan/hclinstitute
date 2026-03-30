import { useQuery } from "@tanstack/react-query";
import { Star, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const AllReviews = () => {
    const navigate = useNavigate();
    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ["public-reviews"],
        queryFn: async () => {
            const res = await fetch("/api/reviews/public");
            if (!res.ok) throw new Error("Failed to fetch reviews");
            return res.json();
        }
    });

    return (
        <div className="min-h-screen bg-[#141416] text-white p-8">
            <div className="max-w-7xl mx-auto">
                <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <h1 className="text-4xl font-bold mb-12 border-b border-white/10 pb-4">All Student Reviews</h1>

                {isLoading ? (
                    <p className="text-gray-400">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <p className="text-gray-400">No reviews yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((review: any) => (
                            <Card key={review.id} className="bg-[#242428] border-none">
                                <CardContent className="p-6 flex flex-col h-full">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                        ))}
                                    </div>
                                    <p className="text-gray-300 italic mb-4 flex-grow">"{review.comment || 'Great experience!'}"</p>

                                    {review.answers && review.answers.length > 0 && (
                                        <div className="space-y-2 mb-6">
                                            {review.answers.map((ans: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-400">{ans.questionText}</span>
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < ans.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mt-auto border-t border-white/10 pt-4">
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                            {review.studentName?.charAt(0) || 'S'}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-bold">{review.studentName}</p>
                                            <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default AllReviews;
