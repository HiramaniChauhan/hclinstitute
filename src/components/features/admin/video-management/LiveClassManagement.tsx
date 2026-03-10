
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Upload, Video, Eye, Youtube, Plus, Calendar } from "lucide-react";
import { useState } from "react";

const SUBJECTS = ["Mathematics", "Reasoning", "Computer"];

export const LiveClassManagement = () => {
  const [liveUrl, setLiveUrl] = useState("");

  const videos = [
    { id: 1, title: "Mathematics - Algebra Basics", duration: "45:30", views: 1234, status: "Published", type: "upload" },
    { id: 2, title: "Reasoning - Logical Patterns", duration: "38:15", views: 987, status: "Published", type: "youtube" },
    { id: 3, title: "Computer - Programming Fundamentals", duration: "52:20", views: 1456, status: "Draft", type: "upload" },
    { id: 4, title: "Mathematics - Geometry", duration: "41:10", views: 876, status: "Published", type: "youtube" }
  ];

  const liveClasses = [
    { id: 1, title: "Advanced Mathematics Session", subject: "Mathematics", date: "2024-01-15", time: "10:00 AM", duration: "2 hours" },
    { id: 2, title: "Reasoning Workshop", subject: "Reasoning", date: "2024-01-16", time: "2:00 PM", duration: "1.5 hours" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Live Class Management</h1>
      </div>

      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-fit grid-cols-1">
          <TabsTrigger value="live">Live Classes</TabsTrigger>
        </TabsList>



        <TabsContent value="live" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Live Class
              </CardTitle>
              <CardDescription>
                Create live interactive sessions for students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Class Title</label>
                  <Input placeholder="Enter class title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <Input type="time" />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (hours)</label>
                  <Input type="number" placeholder="2" step="0.5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Meeting Link</label>
                  <Input placeholder="Zoom/Meet link" />
                </div>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Live Class
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Live Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveClasses.map((liveClass) => (
                  <div key={liveClass.id} className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{liveClass.title}</h3>
                        <p className="text-sm text-gray-600">Subject: {liveClass.subject}</p>
                        <p className="text-sm text-gray-600">
                          {liveClass.date} at {liveClass.time} ({liveClass.duration})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">Start Class</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
