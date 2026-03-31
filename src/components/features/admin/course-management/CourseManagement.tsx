
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen, Users, IndianRupee, Plus, Edit, Trash2, Upload, ImageIcon, Loader2, Search
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef, useCallback } from "react";
import { ImageCropDialog } from "./ImageCropDialog";
import { fetchCourseStudents } from "@/api/portalApi";
import { StudentDetail } from "../student-management/StudentDetail";

export const CourseManagement = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");
  const [viewStudentsCourse, setViewStudentsCourse] = useState<any | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [selectedStudentFromCourse, setSelectedStudentFromCourse] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    duration: "",
    maxStudents: "",
    description: "",
    profilePicData: "", // Base64 string for image
    accessFeatures: [] as string[]
  });

  const fetchCourses = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data || []);
      }
    } catch (error) {
      console.error("Fetch courses error:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const toggleAccess = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      accessFeatures: prev.accessFeatures.includes(feature)
        ? prev.accessFeatures.filter(f => f !== feature)
        : [...prev.accessFeatures, feature]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setRawImageSrc(event.target?.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleCreateOpen = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      price: "",
      duration: "",
      maxStudents: "",
      description: "",
      profilePicData: "",
      accessFeatures: []
    });
    setOpen(true);
  };

  const handleEditOpen = (course: any) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || "",
      price: (course.price || 0).toString(),
      duration: course.duration || "",
      maxStudents: (course.maxStudents || 0).toString(),
      description: course.description || "",
      profilePicData: course.profilePicData || "",
      accessFeatures: course.accessFeatures || ['Lectures', 'Tests', 'Notes']
    });
    setOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Course deleted successfully");
        fetchCourses();
      } else {
        toast.error("Failed to delete course");
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.duration) {
      toast.error("Please fill in course title, price, and duration");
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const payload = {
        title: formData.title,
        price: Number(formData.price),
        duration: formData.duration,
        maxStudents: Number(formData.maxStudents) || 100,
        description: formData.description,
        accessFeatures: formData.accessFeatures,
        profilePicData: formData.profilePicData,
      };

      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses';
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`Course ${editingCourse ? 'updated' : 'created'} successfully`);
        setOpen(false);
        fetchCourses();
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error || errData?.message || `Server error ${response.status}`;
        console.error("Save course error response:", response.status, errData);
        toast.error(`Failed to save course: ${errMsg}`);
      }
    } catch (error) {
      console.error("Save course error", error);
      toast.error("Network error — check if server is running");
    }
  };

  const handleViewStudents = async (course: any) => {
    setViewStudentsCourse(course);
    setLoadingStudents(true);
    setStudentSearchTerm("");
    try {
      const students = await fetchCourseStudents(course.id);
      setEnrolledStudents(students);
    } catch (error) {
      console.error("Fetch course students error", error);
      toast.error("Failed to load enrolled students");
    } finally {
      setLoadingStudents(false);
    }
  };

  // If a student is selected from the course dialog, show their detail page
  if (selectedStudentFromCourse) {
    return (
      <StudentDetail
        studentId={selectedStudentFromCourse}
        onBack={() => setSelectedStudentFromCourse(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Course Management</h1>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateOpen}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Update the details of the course." : "Fill in the details to create a new course."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter course title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="4999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration <span className="text-xs text-gray-400 font-normal">(in months — e.g. 6, 12, 24)</span></Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 6"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Students</Label>
                  <Input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter course description..."
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Course Cover Photo</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formData.profilePicData ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <img
                        src={formData.profilePicData}
                        alt="Course cover preview"
                        className="w-full max-h-48 object-cover rounded-lg shadow"
                      />
                      <p className="text-xs text-gray-500">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                      <ImageIcon size={40} className="opacity-50" />
                      <p className="text-sm font-medium text-gray-500">Click to upload a cover photo</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5MB</p>
                    </div>
                  )}
                </div>
                {/* Crop Dialog */}
                <ImageCropDialog
                  open={cropDialogOpen}
                  imageSrc={rawImageSrc}
                  onClose={() => setCropDialogOpen(false)}
                  onCropDone={(cropped) => setFormData(prev => ({ ...prev, profilePicData: cropped }))}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
                {formData.profilePicData && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setFormData(prev => ({ ...prev, profilePicData: "" }))}
                  >
                    Remove Photo
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Course Access Control</Label>
                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                  {['Lectures', 'Live Classes', 'Tests', 'Notes'].map((feature) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={`access-${feature}`}
                        checked={formData.accessFeatures.includes(feature)}
                        onCheckedChange={() => toggleAccess(feature)}
                      />
                      <Label htmlFor={`access-${feature}`} className="cursor-pointer">{feature}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Select which features students will get access to upon enrollment.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center p-4 text-gray-500">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="text-center p-4 text-gray-500">No courses available.</p>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    {course.profilePicData ? (
                      <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border">
                        <img src={course.profilePicData} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full md:w-48 h-32 rounded-lg bg-gray-100 border flex flex-col items-center justify-center flex-shrink-0 text-gray-400">
                        <ImageIcon size={32} className="mb-2 opacity-50" />
                        <span className="text-xs">No Image</span>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditOpen(course)}>
                              <Edit size={14} className="mr-1" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(course.id)}>
                              <Trash2 size={14} className="mr-1" />
                              Delete
                            </Button>
                            <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleViewStudents(course)}>
                              <Users size={14} className="mr-1" />
                              Students
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{course.description}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                          <IndianRupee size={14} />
                          {Number(course.price).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {course.duration ? `${course.duration} months` : "—"}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          <Users size={14} />
                          {course.enrolledCount || 0} enrolled
                        </span>
                      </div>

                      {course.accessFeatures && course.accessFeatures.length > 0 && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {course.accessFeatures.map((feature: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">{feature}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Enrolled Students Dialog */}
      <Dialog open={!!viewStudentsCourse} onOpenChange={(open) => !open && setViewStudentsCourse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Enrolled Students: {viewStudentsCourse?.title}</DialogTitle>
            <DialogDescription>
              A list of all students currently enrolled in this course.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 px-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-8"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {loadingStudents ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            ) : enrolledStudents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No students enrolled in this course yet.</p>
              </div>
            ) : enrolledStudents.filter(s =>
              s.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
              s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-12 text-gray-500 italic">
                No students matching "{studentSearchTerm}"
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledStudents
                  .filter(s =>
                    s.name?.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                    s.email?.toLowerCase().includes(studentSearchTerm.toLowerCase())
                  )
                  .sort((a, b) => {
                    const dateA = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
                    const dateB = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
                    return dateB - dateA; // Most recent first
                  })
                  .map((student) => (
                    <div
                      key={student.id}
                      className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors group"
                      onClick={() => {
                        setViewStudentsCourse(null);
                        setSelectedStudentFromCourse(student.id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-indigo-600 group-hover:underline">{student.name}</p>
                          <p className="text-xs text-gray-500 italic">{student.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Enrolled On</p>
                        <p className="text-xs font-medium">{student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStudentsCourse(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
