import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trophy, Plus, Trash2, Upload, Loader2, X, Linkedin, School, Search, Users, Star, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ImageCropDialog } from "../course-management/ImageCropDialog";

export const SelectedStudentsManagement = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");

  const filteredSearchItems = allStudents.filter(s =>
    (s.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (s.rank?.toString() || "").includes(searchTerm) ||
    (s.collegeAllotted?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (s.year?.toString() || "").includes(searchTerm)
  );

  const displayedStudents = searchTerm.trim() ? filteredSearchItems : students;
  const [newStudent, setNewStudent] = useState<any>({
    name: "",
    rank: "",
    collegeAllotted: "",
    linkedinId: "",
    batch: "",
    year: new Date().getFullYear().toString(),
    photo: ""
  });

  const availableYears = Array.from(
    new Set([
      ...allStudents.map(s => s.year),
      ...Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + 1 - i).toString())
    ])
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const fetchStudents = async (year: string) => {
    setLoading(true);
    try {
      // Fetch yearly students
      const response = await fetch(`/api/selected-students?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }

      // Fetch all students for overall stats
      const allResponse = await fetch(`/api/selected-students`);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllStudents(allData);
      }
    } catch (error) {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(selectedYear);
  }, [selectedYear]);

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.rank || !newStudent.year || !newStudent.collegeAllotted) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const isEditing = !!editingStudentId;
      const url = isEditing ? `/api/selected-students/${editingStudentId}` : '/api/selected-students';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newStudent,
          rank: parseInt(newStudent.rank)
        })
      });

      if (response.ok) {
        toast.success(isEditing ? "Student updated successfully" : "Student added successfully");
        setIsAddOpen(false);
        setEditingStudentId(null);
        setNewStudent({
          name: "",
          rank: "",
          collegeAllotted: "",
          linkedinId: "",
          batch: "",
          year: selectedYear,
          photo: ""
        });
        fetchStudents(selectedYear);
      } else {
        toast.error(isEditing ? "Failed to update student" : "Failed to add student");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  const handleEditClick = (student: any) => {
    setEditingStudentId(student.id);
    setNewStudent({
      name: student.name,
      rank: student.rank.toString(),
      collegeAllotted: student.collegeAllotted,
      linkedinId: student.linkedinId || "",
      batch: student.batch,
      year: student.year,
      photo: student.photo || ""
    });
    setIsAddOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Remove this student from the list?")) return;

    try {
      const response = await fetch(`/api/selected-students/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success("Student removed");
        fetchStudents(selectedYear);
      } else {
        toast.error("Failed to remove student");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageSrc(reader.result as string);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Selected Students Management
        </h1>
        <div className="flex flex-wrap items-center gap-3">
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
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setEditingStudentId(null);
              setNewStudent({
                name: "",
                rank: "",
                collegeAllotted: "",
                linkedinId: "",
                batch: "",
                year: selectedYear,
                photo: ""
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Selected Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingStudentId ? 'Edit Selected Student' : 'Add New Selected Student'}</DialogTitle>
                <DialogDescription>{editingStudentId ? 'Update student details.' : 'Add a student to the hall of fame.'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Student Name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
                  <Input placeholder="Rank" type="number" value={newStudent.rank} onChange={e => setNewStudent({ ...newStudent, rank: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="College Allotted" value={newStudent.collegeAllotted} onChange={e => setNewStudent({ ...newStudent, collegeAllotted: e.target.value })} />
                  <Input placeholder="LinkedIn ID (Optional)" value={newStudent.linkedinId} onChange={e => setNewStudent({ ...newStudent, linkedinId: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Batch" value={newStudent.batch} onChange={e => setNewStudent({ ...newStudent, batch: e.target.value })} />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Selected Year</label>
                    <select
                      className="px-3 py-2 border rounded-lg w-full bg-white text-gray-900"
                      value={newStudent.year}
                      onChange={e => setNewStudent({ ...newStudent, year: e.target.value })}
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
                  {newStudent.photo ? (
                    <div className="relative inline-block">
                      <img src={newStudent.photo} alt="Preview" className="w-24 h-24 rounded-full object-cover mx-auto ring-2 ring-blue-500" />
                      <button onClick={() => setNewStudent({ ...newStudent, photo: "" })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">Upload Student Photo (Optional)</p>
                      <label className="cursor-pointer text-blue-500 font-medium hover:underline mt-2 inline-block">
                        Choose File
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    </>
                  )}
                </div>
                <ImageCropDialog
                  open={cropDialogOpen}
                  imageSrc={rawImageSrc}
                  aspectRatio={1}
                  onClose={() => setCropDialogOpen(false)}
                  onCropDone={(cropped) => setNewStudent((prev: any) => ({ ...prev, photo: cropped }))}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddStudent} className="w-full">
                  {editingStudentId ? 'Update Student Entry' : 'Save Student Entry'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Success Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{allStudents.length}</div>
                  <p className="text-sm">Overall Selected</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{students.length}</div>
                  <p className="text-sm">Selected in {selectedYear}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {students.length > 0 ? `#${Math.min(...students.map(s => s.rank))}` : "N/A"}
                  </div>
                  <p className="text-sm">Best Rank ({selectedYear})</p>
                </CardContent>
              </Card>
            </div>

            {/* Students List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {searchTerm.trim() ? `Search Results (${displayedStudents.length} items)` : `Selected Students - ${selectedYear}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayedStudents.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    {searchTerm.trim()
                      ? `No students found matching "${searchTerm}"`
                      : `No records found for ${selectedYear}. Click "Add Selected Student" to create one.`}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...displayedStudents]
                      .sort((a, b) => {
                        if (searchTerm.trim()) {
                          return parseInt(b.year) - parseInt(a.year) || a.rank - b.rank;
                        }
                        return a.rank - b.rank;
                      })
                      .map((student) => (
                        <div key={student.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <img
                                  src={student.photo || "https://images.unsplash.com/photo-1544717297-fa95b3396467?w=100&h=100&fit=crop"}
                                  alt={student.name}
                                  className="w-16 h-16 rounded-full object-cover shadow-sm ring-1 ring-gray-100"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-lg text-gray-900">{student.name}</h3>
                                  <span className="text-2xl font-black text-blue-600 whitespace-nowrap">Rank-{student.rank}</span>
                                  {searchTerm.trim() && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 ml-1">
                                      {student.year}
                                    </Badge>
                                  )}
                                  {student.linkedinId && (
                                    <a href={student.linkedinId} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                      <Linkedin size={16} />
                                    </a>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline">{student.collegeAllotted}</Badge>
                                  <Badge variant="secondary">{student.batch}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="icon" variant="ghost" className="text-blue-500 hover:bg-blue-50" onClick={() => handleEditClick(student)}>
                                <Pencil size={18} />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteStudent(student.id)}>
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )
      }
    </div >
  );
};
