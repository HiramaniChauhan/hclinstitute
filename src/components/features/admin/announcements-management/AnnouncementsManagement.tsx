
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Edit, Trash2, Calendar, Users, Eye } from "lucide-react";
import { useState } from "react";

export const AnnouncementsManagement = () => {
  const [announcements] = useState([
    {
      id: 1,
      title: "New Test Schedule Released",
      content: "The monthly test schedule for February has been released. Please check your dashboard for details.",
      priority: "high",
      targetAudience: "All Students",
      publishDate: "2024-01-15",
      author: "Hiramani Chauhan",
      status: "published",
      views: 245
    },
    {
      id: 2,
      title: "Library Timing Changes",
      content: "Library will be open from 8 AM to 10 PM starting next week.",
      priority: "medium",
      targetAudience: "All Students",
      publishDate: "2024-01-14",
      author: "Admin",
      status: "published",
      views: 132
    },
    {
      id: 3,
      title: "Special Mathematics Workshop",
      content: "Join our special calculus workshop this weekend. Limited seats available.",
      priority: "low",
      targetAudience: "Mathematics Batch",
      publishDate: "2024-01-12",
      author: "Dr. Rajesh Kumar",
      status: "draft",
      views: 0
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="h-8 w-8" />
          Announcements Management
        </h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Create Announcement Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Announcement Title" />
          <Textarea placeholder="Announcement Content" rows={4} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="px-3 py-2 border rounded-lg">
              <option value="">Select Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select className="px-3 py-2 border rounded-lg">
              <option value="">Target Audience</option>
              <option value="all">All Students</option>
              <option value="mathematics">Mathematics Batch</option>
              <option value="reasoning">Reasoning Batch</option>
              <option value="computer">Computer Batch</option>
            </select>
            <Input type="date" />
          </div>
          <div className="flex gap-2">
            <Button>Publish Now</Button>
            <Button variant="outline">Save as Draft</Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      <Badge className={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                      <Badge variant={announcement.status === 'published' ? 'default' : 'secondary'}>
                        {announcement.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{announcement.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {announcement.publishDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {announcement.targetAudience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {announcement.views} views
                      </span>
                      <span>by {announcement.author}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye size={14} className="mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
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
