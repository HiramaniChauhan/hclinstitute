
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Users, IndianRupee, Plus, Edit, Trash2 } from "lucide-react";
import { dummyCourses, Course } from "@/data/courseData";
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
import { useState } from "react";

export const CourseManagement = () => {
  const [courses, setCourses] = useState<Course[]>(dummyCourses);
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    duration: "",
    level: "",
    instructor: "",
    maxStudents: "",
    description: "",
    subjects: "",
    accessFeatures: [] as string[]
  });

  const toggleAccess = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      accessFeatures: prev.accessFeatures.includes(feature)
        ? prev.accessFeatures.filter(f => f !== feature)
        : [...prev.accessFeatures, feature]
    }));
  };

  const handleCreateOpen = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      price: "",
      duration: "",
      level: "",
      instructor: "",
      maxStudents: "",
      description: "",
      subjects: "",
      accessFeatures: []
    });
    setOpen(true);
  };

  const handleEditOpen = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      price: course.price.toString(),
      duration: course.duration,
      level: course.level,
      instructor: "Dr. Rajesh Kumar", // Mock data doesn't have instructor, using default
      maxStudents: course.maxStudents.toString(),
      description: course.description,
      subjects: course.subjects.join(", "),
      accessFeatures: ['Lectures', 'Tests', 'Notes'] // Mock default access
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (editingCourse) {
      // Update logic
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? {
        ...c,
        title: formData.title,
        price: Number(formData.price),
        duration: formData.duration,
        level: formData.level,
        maxStudents: Number(formData.maxStudents),
        description: formData.description,
        subjects: formData.subjects.split(",").map(s => s.trim())
      } : c));
      console.log("Updated course:", { ...editingCourse, ...formData });
    } else {
      // Create logic
      const newCourse = {
        id: courses.length + 1,
        title: formData.title,
        price: Number(formData.price),
        duration: formData.duration,
        level: formData.level,
        maxStudents: Number(formData.maxStudents),
        description: formData.description,
        subjects: formData.subjects.split(",").map(s => s.trim()),
        enrolledStudents: 0
      };
      setCourses(prev => [...prev, newCourse]);
      console.log("Created course:", newCourse);
    }
    setOpen(false);
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
                  <Label>Duration</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="6 Months"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(val) => setFormData({ ...formData, level: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Instructor</Label>
                  <Input
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    placeholder="Dr. Rajesh Kumar"
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

              <div className="space-y-2">
                <Label>Subjects (comma separated)</Label>
                <Input
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="Mathematics, Reasoning, Computer"
                />
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
            {courses.map((course) => (
              <div key={course.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-gray-600 text-sm">{course.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <IndianRupee size={14} />
                        {course.price.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {course.enrolledStudents} / {course.maxStudents} students
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={14} />
                        {course.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline">{course.level}</Badge>
                      {course.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary">{subject}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditOpen(course)}>
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
