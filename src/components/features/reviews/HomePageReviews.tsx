import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquareQuote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const HomePageReviews = () => {
    const navigate = useNavigate();
    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ["public-reviews"],
        queryFn: async () => {
            const res = await fetch("/api/reviews/public");
            if (!res.ok) throw new Error("Failed to fetch reviews");
            return res.json();
        }
    });

    if (isLoading || reviews.length === 0) return null;

    const topReviews = reviews.slice(0, 3);

    return (
        <section className="py-24 bg-[#141416]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="text-left">
                        <h2 className="text-4xl md:text-5xl font-black mb-4"><span className="text-white">Student</span> <span className="text-red-500">Reviews</span></h2>
                        <div className="h-1 w-20 bg-red-500 rounded-full"></div>
                    </div>
                    <Button
                        onClick={() => navigate('/reviews')}
                        className="bg-white text-black hover:bg-gray-200 border-none transition-all text-xs font-bold px-6 py-2 rounded shadow-lg flex items-center uppercase tracking-wider"
                    >
                        SHOW ALL REVIEWS
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {topReviews.map((review: any) => (
                        <Card key={review.id} className="bg-[#242428] border-none hover:-translate-y-2 transition-transform duration-300">
                            <CardContent className="p-8">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < review.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                    ))}
                                </div>
                                <MessageSquareQuote className="w-10 h-10 text-white/10 mb-4" />
                                <p className="text-gray-300 italic mb-6 line-clamp-4">"{review.comment || 'Great experience!'}"</p>

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

                                <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                                    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-red-500/20 flex items-center justify-center text-red-500 font-bold">
                                        {review.studentName?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{review.studentName}</p>
                                        <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};
