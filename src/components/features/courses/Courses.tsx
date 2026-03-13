
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Users, BookOpen, Search, Filter, Star, IndianRupee, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { PaymentModal } from "./PaymentModal";
import { toast } from "sonner";

export const Courses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetch('/api/courses', { headers }),
        fetch('/api/enrollments/my', { headers })
      ]);

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data || []);
      }
      if (enrollmentsRes.ok) {
        const enrollData = await enrollmentsRes.json();
        setMyEnrollments(enrollData || []);
      }
    } catch (error) {
      console.error("Fetch courses error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Available Courses</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search courses..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-3 text-center text-gray-500 py-10">Loading available courses...</p>
        ) : filteredCourses.length === 0 ? (
          <p className="col-span-3 text-center text-gray-500 py-10">No courses found matching your search.</p>
        ) : (
          filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              {course.profilePicData ? (
                <div className="w-full h-40 bg-gray-100 border-b">
                  <img src={course.profilePicData} alt={course.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 border-b flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon size={40} className="mb-2 opacity-50" />
                  <span className="text-sm">No Image Provided</span>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg leading-tight line-clamp-2">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">{course.description}</p>

                {course.accessFeatures && course.accessFeatures.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {course.accessFeatures.map((feature: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-600 mt-auto pt-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{course.duration ? `${course.duration} months` : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>{course.enrolledStudents || 0} / {course.maxStudents || 100} students</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                    <IndianRupee size={18} />
                    {Number(course.price || 0).toLocaleString()}
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                    onClick={() => {
                      const alreadyEnrolled = myEnrollments.some(e => e.courseId === course.id && e.status === 'active');
                      if (alreadyEnrolled) {
                        toast.error("You are already enrolled in this course.", {
                          description: "Check 'My Enrolled Courses' below.",
                          duration: 4000
                        });
                        return;
                      }
                      setSelectedCourse(course);
                      setPaymentModalOpen(true);
                    }}
                  >
                    Enroll Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* My Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Enrolled Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-500">Loading your enrollments...</p>
            ) : myEnrollments.length === 0 ? (
              <p className="text-gray-500">You are not enrolled in any courses yet.</p>
            ) : (
              myEnrollments.map((enrollment) => {
                const course = courses.find((c) => c.id === enrollment.courseId);
                if (!course) return null; // Wait for courses to load or course no longer exists

                return (
                  <div key={enrollment.enrollmentId} className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{course.title}</h3>
                        <p className="text-sm text-gray-600">Enrolled on: {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={enrollment.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                            {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                          </Badge>
                          {course.accessFeatures && course.accessFeatures.map((feat: string, i: number) => (
                            <Badge key={i} variant="outline">{feat}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        course={selectedCourse}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedCourse(null);
        }}
        onSuccess={() => {
          fetchCourses();
        }}
      />
    </div>
  );
};
