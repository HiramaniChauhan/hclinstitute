import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy, Search, Star, Calendar, School, Linkedin, Loader2, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const SelectedStudents = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isHoldersOpen, setIsHoldersOpen] = useState(false);

  const availableYears = Array.from(
    new Set([
      ...allStudents.map(s => s.year),
      ...Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + 1 - i).toString())
    ])
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const fetchSelectedStudents = async (year: string) => {
    setLoading(true);
    try {
      // Fetch yearly students
      const yearlyResponse = await fetch(`/api/selected-students?year=${year}`);
      if (yearlyResponse.ok) {
        const data = await yearlyResponse.json();
        setStudents(data);
      }

      // Fetch all students for top rank calculation
      const allResponse = await fetch(`/api/selected-students`);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllStudents(allData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedStudents(selectedYear);
  }, [selectedYear]);

  const filteredStudents = (searchTerm.trim() ? allStudents : students).filter(s =>
    (s.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (s.collegeAllotted?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (s.rank?.toString() || "").includes(searchTerm)
  );

  const topPerformers = [...filteredStudents].sort((a, b) => a.rank - b.rank).slice(0, 3);

  const allTimeTopRank = allStudents.length > 0 ? Math.min(...allStudents.map(s => s.rank)) : null;
  const topRankHolders = allStudents.filter(s => s.rank === allTimeTopRank);
  const latestHolder = [...topRankHolders].sort((a, b) => parseInt(b.year) - parseInt(a.year) || b.id.localeCompare(a.id))[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Selected Students
        </h1>
        <div className="flex gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search by name, rank, college or year..."
              className="pl-10 w-72"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Success Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{allStudents.length}</div>
                <p className="text-sm">Total Selected All Time</p>
              </CardContent>
            </Card>

            <Dialog open={isHoldersOpen} onOpenChange={setIsHoldersOpen}>
              <DialogTrigger asChild>
                <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]">
                  <CardContent className="p-6 text-center">
                    <Star className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {allTimeTopRank !== null ? `Rank-${allTimeTopRank}` : "N/A"}
                    </div>
                    <p className="text-sm">All Time Top Rank {latestHolder && `(${latestHolder.name})`}</p>
                    <div className="mt-1 text-[10px] opacity-80 flex items-center justify-center gap-1">
                      <Users size={10} /> Click to see all holders
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="text-yellow-500 h-5 w-5" />
                    All Time Rank-{allTimeTopRank} Holders
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {topRankHolders.sort((a, b) => parseInt(b.year) - parseInt(a.year)).map((holder) => (
                    <div key={holder.id} className="flex items-center gap-4 p-3 rounded-lg border bg-gray-50/50">
                      <img src={holder.photo || "https://images.unsplash.com/photo-1544717297-fa95b3396467?w=100&h=100&fit=crop"} alt="" className="w-12 h-12 rounded-full object-cover border" />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{holder.name}</h4>
                        <p className="text-xs text-gray-500">{holder.collegeAllotted}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">{holder.year}</Badge>
                        <p className="text-[10px] text-gray-400 mt-1">{holder.batch}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {searchTerm.trim()
                ? `No students found matching "${searchTerm}"`
                : `No students found for ${selectedYear}.`}
            </div>
          ) : (
            <>
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Hall of Fame - Rank Holders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topPerformers.map((student, index) => (
                      <Card key={student.id} className={`${index === 0 ? 'ring-2 ring-yellow-500' : ''} hover:shadow-lg transition-shadow bg-white`}>
                        <CardContent className="p-6 text-center">
                          <div className="mb-4">
                            <img
                              src={student.photo || "https://images.unsplash.com/photo-1544717297-fa95b3396467?w=100&h=100&fit=crop"}
                              alt={student.name}
                              className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-gray-50 shadow-md"
                            />
                          </div>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{student.name}</h3>
                            <span className={`text-3xl font-black ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-400'
                              }`}>
                              Rank-{student.rank}
                            </span>
                          </div>
                          <div className="mt-3 space-y-3">
                            <Badge variant="outline" className="px-3 py-1">{student.collegeAllotted}</Badge>
                            <div className="flex items-center justify-center gap-3">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700">{student.batch}</Badge>
                              {student.linkedinId && (
                                <a href={student.linkedinId} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors">
                                  <Linkedin size={18} />
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* All Selected Students */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {searchTerm.trim() ? `Search Results (${filteredStudents.length} items)` : `Selected Students Alumni - ${selectedYear}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredStudents
                      .sort((a, b) => {
                        if (searchTerm.trim()) {
                          return parseInt(b.year) - parseInt(a.year) || a.rank - b.rank;
                        }
                        return a.rank - b.rank;
                      })
                      .map((student) => (
                        <div key={student.id} className="p-4 border rounded-xl hover:bg-gray-50 flex items-center gap-4 transition-all">
                          <div className="relative">
                            <img
                              src={student.photo || "https://images.unsplash.com/photo-1544717297-fa95b3396467?w=100&h=100&fit=crop"}
                              alt={student.name}
                              className="w-14 h-14 rounded-full object-cover border border-gray-100"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900 truncate text-lg">{student.name}</h3>
                              <span className="text-2xl font-black text-blue-600 whitespace-nowrap">Rank-{student.rank}</span>
                              {student.linkedinId && (
                                <a href={student.linkedinId} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                  <Linkedin size={14} />
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{student.collegeAllotted}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{student.batch}</Badge>
                              <Badge variant="outline" className="text-[10px] h-5 px-1.5">{student.year}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};
