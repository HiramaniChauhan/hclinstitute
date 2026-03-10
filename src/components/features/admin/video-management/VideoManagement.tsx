
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Upload, Video, Eye, Youtube, Plus, Calendar } from "lucide-react";
import { useState } from "react";

const SUBJECTS = ["Mathematics", "Reasoning", "Computer"];

export const VideoManagement = () => {
    const [youtubeUrl, setYoutubeUrl] = useState("");

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
                <h1 className="text-3xl font-bold text-gray-900">Video & Live Class Management</h1>
                <div className="flex gap-2">
                    <Button className="bg-red-600 hover:bg-red-700">
                        <Youtube className="w-4 h-4 mr-2" />
                        Add YouTube Video
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="videos" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="videos">Video Library</TabsTrigger>
                    <TabsTrigger value="youtube">YouTube Integration</TabsTrigger>
                    <TabsTrigger value="live">Live Classes</TabsTrigger>
                </TabsList>

                <TabsContent value="videos" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Video className="w-5 h-5 mr-2" />
                                    Total Videos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">156</div>
                                <p className="text-sm text-gray-600">+12 this month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Eye className="w-5 h-5 mr-2" />
                                    Total Views
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">45.2K</div>
                                <p className="text-sm text-gray-600">+2.3K this month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Play className="w-5 h-5 mr-2" />
                                    Watch Time
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">892h</div>
                                <p className="text-sm text-gray-600">+124h this month</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Video Library</CardTitle>
                            <CardDescription>Manage your video content</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Title</th>
                                            <th className="text-left p-2">Type</th>
                                            <th className="text-left p-2">Duration</th>
                                            <th className="text-left p-2">Views</th>
                                            <th className="text-left p-2">Status</th>
                                            <th className="text-left p-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {videos.map((video) => (
                                            <tr key={video.id} className="border-b">
                                                <td className="p-2 font-medium">{video.title}</td>
                                                <td className="p-2">
                                                    {video.type === 'youtube' ? (
                                                        <Youtube className="w-4 h-4 text-red-600" />
                                                    ) : (
                                                        <Upload className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </td>
                                                <td className="p-2">{video.duration}</td>
                                                <td className="p-2">{video.views}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${video.status === 'Published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {video.status}
                                                    </span>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline">Edit</Button>
                                                        <Button size="sm" variant="outline">Delete</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="youtube" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Youtube className="w-5 h-5 mr-2 text-red-600" />
                                Add YouTube Video
                            </CardTitle>
                            <CardDescription>
                                Add YouTube videos for students to watch later. Perfect for supplementary content.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Video Title</label>
                                    <Input placeholder="Enter video title" />
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
                            </div>
                            <div>
                                <label className="text-sm font-medium">YouTube URL</label>
                                <Input
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    className="w-full p-2 border rounded-md"
                                    rows={3}
                                    placeholder="Brief description of the video content..."
                                />
                            </div>
                            <Button className="bg-red-600 hover:bg-red-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add YouTube Video
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

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
