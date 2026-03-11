
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText } from "lucide-react";

export const AdminDashboard = () => {
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [activeTests, setActiveTests] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Total Students
        const studentsResp = await fetch('/api/admin/students', { headers });
        if (studentsResp.ok) {
          const studentsData = await studentsResp.json();
          setTotalStudents(Array.isArray(studentsData) ? studentsData.length : 0);
        }

        // Fetch Active Tests
        const testsResp = await fetch('/api/tests', { headers });
        if (testsResp.ok) {
          const testsData = await testsResp.json();
          if (Array.isArray(testsData)) {
            const now = new Date();
            const active = testsData.filter(test => {
              if (!test.startDate) return false; // Needs a start date to be "active"

              // Check start time
              const start = new Date(`${test.startDate}T${test.startTime || '00:00'}`);
              if (now < start) return false; // Hasn't started yet

              // Check end time (if specified)
              if (test.endDate) {
                const end = new Date(`${test.endDate}T${test.endTime || '23:59'}`);
                if (now > end) return false; // Has ended
              }

              return true; // Is within active window
            });
            setActiveTests(active.length);
          } else {
            setActiveTests(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Students",
      value: totalStudents.toString(),
      icon: Users,
    },
    {
      title: "Active Tests",
      value: activeTests.toString(),
      icon: FileText,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, Admin!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
