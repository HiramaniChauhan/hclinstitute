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
        <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen" style={{ background: '#faf8f3' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full shadow-sm" style={{ background: '#fff', border: '1px solid rgba(74,124,89,0.15)' }}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: "'Fraunces', serif", color: '#3d3830' }}>
                            All Selected Students
                        </h1>
                        <p style={{ color: '#8a8278' }} className="mt-1">Our hall of fame across all years</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search by name, rank, college or year..."
                        className="pl-10 w-full md:w-96 h-12 shadow-sm" style={{ background: '#fff', borderColor: 'rgba(74,124,89,0.15)', borderRadius: '12px' }}
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
                    <Loader2 className="h-12 w-12 animate-spin" style={{ color: '#4a7c59' }} />
                    <p style={{ color: '#b5ad9f' }} className="font-medium">Loading success stories...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" style={{ color: '#4a7c59' }} />
                        <span className="font-semibold" style={{ color: '#3d3830' }}>Total Selections: {filteredStudents.length}</span>
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
                                <Card key={student.id} className="group hover:shadow-2xl transition-all duration-300 border-none overflow-hidden rounded-2xl" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(61,56,48,0.08)', border: '1px solid rgba(74,124,89,0.15)' }}>
                                    <div className="h-2" style={{ background: 'linear-gradient(to right, #c17f24, #b8860b, #4a7c59)' }} />
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: '#4a7c59' }} />
                                                <img
                                                    src={student.photo || "https://images.unsplash.com/photo-1544717297-fa95b3396467?w=200&h=200&fit=crop"}
                                                    alt={student.name}
                                                    className="w-24 h-24 rounded-full object-cover relative ring-4 ring-white shadow-lg"
                                                />
                                                <div className="absolute -bottom-2 -right-2">
                                                    <Badge className="h-8 w-8 rounded-full border-2 border-white shadow-md flex items-center justify-center p-0" style={{ background: '#c17f24', color: '#fff' }}>
                                                        <Star size={14} fill="currentColor" />
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-1 w-full">
                                                <h3 className="font-bold text-xl truncate transition-colors" style={{ color: '#3d3830', fontFamily: "'Fraunces', serif" }}>
                                                    {student.name}
                                                </h3>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-2xl font-black text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #4a7c59, #3d6b4a)' }}>
                                                        Rank-{student.rank}
                                                    </span>
                                                    <Badge variant="outline" className="font-bold" style={{ borderColor: 'rgba(74,124,89,0.15)', background: 'rgba(74,124,89,0.1)', color: '#4a7c59' }}>
                                                        {student.year}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-3 pt-2">
                                                <div className="p-3 rounded-xl transition-all" style={{ background: 'rgba(74,124,89,0.06)', border: '1px solid rgba(74,124,89,0.12)' }}>
                                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#b5ad9f' }}>College Allotted</p>
                                                    <p className="text-sm font-bold leading-tight truncate" style={{ color: '#3d3830' }}>{student.collegeAllotted}</p>
                                                </div>

                                                <div className="flex items-center rounded-lg p-2 gap-2" style={{ background: 'rgba(74,124,89,0.05)' }}>
                                                    <Badge variant="secondary" className="flex-1 shadow-sm text-[10px] py-1" style={{ background: '#fff', border: '1px solid rgba(74,124,89,0.12)' }}>
                                                        {student.batch}
                                                    </Badge>
                                                    {student.linkedinId && (
                                                        <a
                                                            href={student.linkedinId}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-8 h-8 flex items-center justify-center rounded-full transition-all shadow-sm" style={{ background: 'rgba(74,124,89,0.1)', color: '#4a7c59' }}
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
