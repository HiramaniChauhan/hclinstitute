import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Search, Star, Loader2, ArrowLeft, Linkedin, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const AllSelectedStudents = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const fetchAllStudents = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/selected-students");
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Connection error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        (s.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (s.collegeAllotted?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (s.rank?.toString() || "").includes(searchTerm) ||
        (s.year?.toString() || "").includes(searchTerm)
    );

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen bg-gray-50/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full bg-white shadow-sm ring-1 ring-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            All Selected Students
                        </h1>
                        <p className="text-gray-500 mt-1">Our hall of fame across all years</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search by name, rank, college or year..."
                        className="pl-10 w-full md:w-96 h-12 bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <p className="text-gray-400 font-medium">Loading success stories...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-gray-700">Total Selections: {filteredStudents.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredStudents
                            .sort((a, b) => {
                                const yearA = parseInt(a.year) || 0;
                                const yearB = parseInt(b.year) || 0;
                                if (yearB !== yearA) return yearB - yearA;

                                const rankA = parseInt(a.rank) || 999999;
                                const rankB = parseInt(b.rank) || 999999;
                                return rankA - rankB;
                            })
                            .map((student) => (
                                <Card key={student.id} className="group hover:shadow-2xl transition-all duration-300 border-none bg-white ring-1 ring-gray-100 overflow-hidden rounded-2xl">
                                    <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                                                <img
                                                    src={student.photo || "https://images.unsplash.com/photo-1544717297-fa95b3396467?w=200&h=200&fit=crop"}
                                                    alt={student.name}
                                                    className="w-24 h-24 rounded-full object-cover relative ring-4 ring-white shadow-lg"
                                                />
                                                <div className="absolute -bottom-2 -right-2">
                                                    <Badge className="h-8 w-8 rounded-full bg-yellow-400 text-yellow-900 border-2 border-white shadow-md flex items-center justify-center p-0">
                                                        <Star size={14} fill="currentColor" />
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-1 w-full">
                                                <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {student.name}
                                                </h3>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                                        Rank-{student.rank}
                                                    </span>
                                                    <Badge variant="outline" className="border-blue-100 bg-blue-50/50 text-blue-700 font-bold">
                                                        {student.year}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-3 pt-2">
                                                <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-all">
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">College Allotted</p>
                                                    <p className="text-sm font-bold text-gray-700 leading-tight truncate">{student.collegeAllotted}</p>
                                                </div>

                                                <div className="flex items-center bg-gray-50/50 rounded-lg p-2 gap-2">
                                                    <Badge variant="secondary" className="flex-1 bg-white border border-gray-100 shadow-sm text-[10px] py-1">
                                                        {student.batch}
                                                    </Badge>
                                                    {student.linkedinId && (
                                                        <a
                                                            href={student.linkedinId}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Linkedin size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>

                    {filteredStudents.length === 0 && !loading && (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
                            <Users className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                            <h3 className="text-xl font-bold text-gray-800">No students found</h3>
                            <p className="text-gray-500 mt-2">Try adjusting your search terms</p>
                            <Button
                                variant="link"
                                onClick={() => setSearchTerm("")}
                                className="text-blue-500 font-bold mt-2"
                            >
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Add Lucide Users icon that was missing from previous import
import { Users } from "lucide-react";
