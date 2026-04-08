import React, { useEffect, useState } from 'react';
import { fetchTerms } from '@/api/portalApi';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TermsSection {
    id: string;
    heading: string;
    content: string;
}

export const TermsAndConditions = () => {
    const [sections, setSections] = useState<TermsSection[]>([]);
    const [legacyContent, setLegacyContent] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTerms = async () => {
            try {
                const data = await fetchTerms();
                if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
                    setSections(data.sections);
                } else if (data.content) {
                    // Legacy fallback: plain text
                    setLegacyContent(data.content);
                }
            } catch (error) {
                console.error("Failed to load Terms:", error);
                setLegacyContent("Error loading terms and conditions. Please contact support.");
            } finally {
                setLoading(false);
            }
        };

        loadTerms();
        window.scrollTo(0, 0);
    }, []);

    const hasContent = sections.length > 0 || legacyContent;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-full hover:bg-gray-100 flex-shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2 font-bold text-lg text-gray-900">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        Terms & Conditions
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 py-8 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-sm border-gray-200">
                        <CardContent className="p-6 sm:p-10">
                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                </div>
                            ) : hasContent ? (
                                <div className="space-y-8">
                                    {sections.length > 0 ? (
                                        sections.map((section, index) => (
                                            <div key={section.id || index}>
                                                <h2 className="text-lg font-bold text-gray-900 mb-2">
                                                    {index + 1}. {section.heading}
                                                </h2>
                                                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {section.content}
                                                </p>
                                                {index < sections.length - 1 && (
                                                    <hr className="mt-6 border-gray-200" />
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="prose prose-sm sm:prose-base prose-amber max-w-none prose-p:leading-relaxed text-gray-700 font-medium">
                                            <div style={{ whiteSpace: "pre-wrap" }}>
                                                {legacyContent}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                                    <FileText className="h-12 w-12 text-gray-300 mb-3" />
                                    <p>No terms and conditions have been published yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};
