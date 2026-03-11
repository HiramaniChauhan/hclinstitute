
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Users, IndianRupee, Plus, Edit, Trash2, Upload, ImageIcon } from "lucide-react";
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
import { useState, useEffect, useRef } from "react";
import { ImageCropDialog } from "./ImageCropDialog";

export const CourseManagement = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    duration: "",
    maxStudents: "",
    description: "",
    profilePicData: "", // Base64 string for image
    accessFeatures: [] as string[]
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
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
  };

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
        toast.error("Failed to save course");
      }
    } catch (error) {
      console.error("Save course error", error);
      toast.error("Network error");
    }
  };

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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₹2.1M</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enrolled Students</p>
                <p className="text-2xl font-bold">902</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
              <div className="text-yellow-500">⭐</div>
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
                          <Users size={14} />
                          {course.enrolledStudents || 0} / {course.maxStudents || 100} students
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {course.duration ? `${course.duration} months` : "—"}
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
    </div>
  );
};
