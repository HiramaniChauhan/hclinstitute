
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Users, BookOpen, Search, Filter, Star, IndianRupee } from "lucide-react";
import { dummyCourses } from "@/data/courseData";

export const Courses = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Available Courses</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input placeholder="Search courses..." className="pl-10 w-64" />
          </div>
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyCourses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-3" />
              <CardTitle className="text-lg">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{course.level}</Badge>
                {course.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="text-xs">{subject}</Badge>
                ))}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  <span>By {course.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>{course.enrolledStudents} / {course.maxStudents} students</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                  <IndianRupee size={18} />
                  {course.price.toLocaleString()}
                </div>
                <Button size="sm">Enroll Now</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Enrolled Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Complete Mathematics Mastery</h3>
                  <p className="text-sm text-gray-600">Progress: 65% Complete</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Active</Badge>
                    <Badge variant="outline">Mathematics</Badge>
                  </div>
                </div>
                <Button variant="outline">Continue Learning</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
