
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Calendar, Pin, Clock, Users } from "lucide-react";

export const Announcements = () => {
  const announcements = [
    {
      id: 1,
      title: "New Batch Starting - Computer Science Fundamentals",
      content: "We are excited to announce a new batch for Computer Science Fundamentals starting from February 1st, 2024. Limited seats available. Register now!",
      priority: "high",
      author: "Hiramani Chauhan",
      date: "2024-01-20",
      pinned: true,
      category: "Admission",
      targetBatches: ["All Batches"]
    },
    {
      id: 2,
      title: "Test of the Day Schedule Update",
      content: "Starting next week, Test of the Day will be conducted at 10:00 AM instead of 9:00 AM. Please note the timing change.",
      priority: "medium",
      author: "Admin Team",
      date: "2024-01-19",
      pinned: false,
      category: "Schedule",
      targetBatches: ["Morning Batch", "Evening Batch"]
    },
    {
      id: 3,
      title: "Holiday Notice - Republic Day",
      content: "The institute will remain closed on January 26th, 2024 on account of Republic Day. Regular classes will resume from January 27th.",
      priority: "medium",
      author: "Admin Team",
      date: "2024-01-18",
      pinned: false,
      category: "Holiday",
      targetBatches: ["All Batches"]
    },
    {
      id: 4,
      title: "New Study Material Available",
      content: "Latest study material for Mathematics - Advanced Calculus has been uploaded to the Notes section. Download and start studying!",
      priority: "low",
      author: "Dr. Rajesh Kumar",
      date: "2024-01-17",
      pinned: false,
      category: "Study Material",
      targetBatches: ["Morning Batch"]
    },
    {
      id: 5,
      title: "Monthly Test Results Published",
      content: "January monthly test results are now available in the Results section. Check your performance and improvement areas.",
      priority: "high",
      author: "Result Team",
      date: "2024-01-16",
      pinned: true,
      category: "Results",
      targetBatches: ["All Batches"]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Admission": return "bg-blue-500";
      case "Schedule": return "bg-purple-500";
      case "Holiday": return "bg-orange-500";
      case "Study Material": return "bg-green-500";
      case "Results": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <Button variant="outline">Mark All as Read</Button>
      </div>

      {/* Pinned Announcements */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-blue-500" />
            Pinned Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.filter(ann => ann.pinned).map((announcement) => (
              <div key={announcement.id} className="p-4 bg-blue-50 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">{announcement.title}</h3>
                  </div>
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-700 mb-3">{announcement.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {announcement.date}
                    </span>
                    <span>by {announcement.author}</span>
                    <Badge 
                      variant="secondary" 
                      className={`${getCategoryColor(announcement.category)} text-white`}
                    >
                      {announcement.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{announcement.targetBatches.join(", ")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.filter(ann => !ann.pinned).map((announcement) => (
              <div key={announcement.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold">{announcement.title}</h3>
                  </div>
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-gray-700 mb-3">{announcement.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {announcement.date}
                    </span>
                    <span>by {announcement.author}</span>
                    <Badge 
                      variant="secondary" 
                      className={`${getCategoryColor(announcement.category)} text-white`}
                    >
                      {announcement.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-600">{announcement.targetBatches.join(", ")}</span>
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
