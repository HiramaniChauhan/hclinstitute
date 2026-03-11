import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Upload, Video, Eye, Youtube, Plus, Calendar, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const VideoManagement = () => {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Inline edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editSubject, setEditSubject] = useState("");

    // Form state
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Live Class state
    const [liveTitle, setLiveTitle] = useState("");
    const [liveSubject, setLiveSubject] = useState("");
    const [liveDate, setLiveDate] = useState("");
    const [liveTime, setLiveTime] = useState("");
    const [liveLink, setLiveLink] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/videos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setVideos(data);
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
            toast.error("Failed to load video library");
        } finally {
            setLoading(false);
        }
    };

    const handleAddYoutube = async () => {
        if (!title.trim() || !subject.trim() || !youtubeUrl.trim()) {
            toast.error("Title, Subject, and URL are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    subject,
                    youtubeUrl,
                    url: youtubeUrl,
                    description,
                    type: 'youtube',
                    duration: 'N/A' // Could be extracted from YouTube API if needed
                })
            });

            if (response.ok) {
                toast.success("YouTube video added successfully");
                setTitle("");
                setSubject("");
                setYoutubeUrl("");
                setDescription("");
                fetchVideos(); // Refresh list
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to add video");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScheduleLive = async () => {
        if (!liveTitle.trim() || !liveSubject.trim() || !liveDate || !liveTime || !liveLink.trim()) {
            toast.error("All fields (Except duration) are required to schedule a live class");
            return;
        }

        setIsScheduling(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/videos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: liveTitle,
                    subject: liveSubject,
                    url: liveLink,
                    type: 'live',
                    status: 'Scheduled',
                    date: liveDate,
                    time: liveTime
                })
            });

            if (response.ok) {
                toast.success("Live Class scheduled successfully");
                setLiveTitle("");
                setLiveSubject("");
                setLiveDate("");
                setLiveTime("");
                setLiveLink("");
                fetchVideos(); // Refresh list
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to schedule class");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setIsScheduling(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`/api/videos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                toast.success(`Class marked as ${newStatus}`);
                fetchVideos(); // Refresh to move it to library or active
            } else {
                toast.error(`Failed to mark class as ${newStatus}`);
            }
        } catch (error) {
            toast.error("Network error");
        }
    }

    const handleSaveEdit = async (id: string, currentVideo: any) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`/api/videos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...currentVideo, title: editTitle, subject: editSubject })
            });

            if (response.ok) {
                toast.success("Video updated successfully");
                setEditingId(null);
                fetchVideos();
            } else {
                toast.error("Failed to update video");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    const handleEditClick = (video: any) => {
        setEditingId(video.id);
        setEditTitle(video.title);
        setEditSubject(video.subject);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this video?")) return;

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`/api/videos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success("Video deleted");
                setVideos(videos.filter(v => v.id !== id));
            } else {
                toast.error("Failed to delete video");
            }
        } catch (error) {
            toast.error("Network error");
        }
    };

    // Filter library videos vs live scheduled classes
    const libraryVideos = videos.filter(v =>
        (v.type !== 'live' || v.status === 'Published') &&
        ((v.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
            (v.subject || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
    );
    const activeLiveClasses = videos.filter(v =>
        v.type === 'live' && (v.status === 'Scheduled' || v.status === 'Live')
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Video & Live Class Management</h1>
            </div>

            <Tabs defaultValue="videos" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="videos">Video Library</TabsTrigger>
                    <TabsTrigger value="youtube">YouTube Integration</TabsTrigger>
                    <TabsTrigger value="live">Live Classes</TabsTrigger>
                </TabsList>

                <TabsContent value="videos" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Video className="w-5 h-5 mr-2" />
                                    Total Videos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{videos.filter(v => v.type !== 'live' || v.status === 'Published').length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    Search Videos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    placeholder="Search by title or subject..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-md"
                                />
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
                                            <th className="text-left p-2">Subject</th>
                                            <th className="text-left p-2">Type</th>
                                            <th className="text-left p-2">Status</th>
                                            <th className="text-left p-2 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={5} className="text-center p-4">Loading videos...</td></tr>
                                        ) : libraryVideos.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center p-4 text-gray-500">No videos found.</td></tr>
                                        ) : (
                                            libraryVideos.map((video) => (
                                                <tr key={video.id} className="border-b">
                                                    <td className="p-2 font-medium">
                                                        {editingId === video.id ? (
                                                            <Input
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                className="h-8 max-w-[200px]"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            video.title
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {editingId === video.id ? (
                                                            <Input
                                                                value={editSubject}
                                                                onChange={(e) => setEditSubject(e.target.value)}
                                                                className="h-8 max-w-[150px]"
                                                            />
                                                        ) : (
                                                            video.subject
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {video.type === 'youtube' ? (
                                                            <div title="YouTube"><Youtube className="w-4 h-4 text-red-600" /></div>
                                                        ) : video.type === 'live' ? (
                                                            <div title="Past Live Class"><Video className="w-4 h-4 text-purple-600" /></div>
                                                        ) : (
                                                            <div title="Direct Upload"><Upload className="w-4 h-4 text-blue-600" /></div>
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${video.status === 'Published'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {video.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {editingId === video.id ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="bg-green-50 text-green-600 hover:bg-green-100 border-none shadow-none"
                                                                    onClick={() => handleSaveEdit(video.id, video)}
                                                                >
                                                                    Save
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none shadow-none"
                                                                    onClick={() => handleEditClick(video)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none"
                                                                onClick={() => handleDelete(video.id)}
                                                            >
                                                                <Trash2 size={14} className="mr-1" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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
                                    <Input
                                        placeholder="Enter video title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input
                                        placeholder="Type subject name (e.g. History)"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                    />
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
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <Button
                                className="bg-red-600 hover:bg-red-700"
                                onClick={handleAddYoutube}
                                disabled={isSubmitting}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {isSubmitting ? "Adding..." : "Add YouTube Video"}
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
                                    <Input
                                        placeholder="Enter class title"
                                        value={liveTitle}
                                        onChange={(e) => setLiveTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input
                                        placeholder="Type subject name"
                                        value={liveSubject}
                                        onChange={(e) => setLiveSubject(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Date</label>
                                    <Input
                                        type="date"
                                        value={liveDate}
                                        onChange={(e) => setLiveDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Time</label>
                                    <Input
                                        type="time"
                                        value={liveTime}
                                        onChange={(e) => setLiveTime(e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-sm font-medium">Meeting Link URL (e.g. YouTube Live, Meet, Zoom)</label>
                                    <Input
                                        placeholder="https://..."
                                        value={liveLink}
                                        onChange={(e) => setLiveLink(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={handleScheduleLive}
                                disabled={isScheduling}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                {isScheduling ? "Scheduling..." : "Schedule Live Class"}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Scheduled & Active Live Classes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activeLiveClasses.length === 0 ? (
                                    <p className="text-gray-500 italic p-4 text-center">No upcoming or active live classes.</p>
                                ) : (
                                    activeLiveClasses.map((liveClass) => (
                                        <div key={liveClass.id} className={`p-4 border rounded-lg ${liveClass.status === 'Live' ? 'bg-red-50 border-red-200' : 'bg-green-50'}`}>
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">{liveClass.title}</h3>
                                                        {liveClass.status === 'Live' && (
                                                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center">
                                                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse mr-1.5"></span>
                                                                LIVE NOW
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">Subject: {liveClass.subject}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {liveClass.date} at {liveClass.time}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {liveClass.status === 'Scheduled' ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    const title = prompt("New Title:", liveClass.title);
                                                                    if (title) handleUpdateStatus(liveClass.id, liveClass.status); // Basic hack for edit for now, better to just recreate
                                                                }}
                                                            >Edit</Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 font-bold"
                                                                onClick={() => handleUpdateStatus(liveClass.id, 'Live')}
                                                            >Start Class</Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="bg-red-600 hover:bg-red-700 font-bold"
                                                            onClick={() => handleUpdateStatus(liveClass.id, 'Published')}
                                                        >Stop & Save to Library</Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
