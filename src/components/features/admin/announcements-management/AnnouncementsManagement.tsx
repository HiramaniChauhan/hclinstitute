import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Plus, Trash2, Calendar, Users, Pin, BookOpen, Loader2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const CATEGORIES = ["General", "Admission", "Schedule", "Holiday", "Study Material", "Results", "Exam"];
const PRIORITIES = ["high", "medium", "low"];

export const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium",
    category: "General",
    targetCourseIds: [] as string[],   // empty = all students
    pinned: false,
    status: "published",
  });

  const token = () => localStorage.getItem("token");
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  const fetchAll = async () => {
    try {
      const [aRes, cRes] = await Promise.all([
        fetch("/api/announcements", { headers: headers() }),
        fetch("/api/courses", { headers: headers() }),
      ]);
      if (aRes.ok) setAnnouncements(await aRes.json());
      if (cRes.ok) setCourses(await cRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => setFormData({
    title: "", content: "", priority: "medium", category: "General",
    targetCourseIds: [], pinned: false, status: "published",
  });

  const handleOpen = (announcement?: any) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        priority: announcement.priority || "medium",
        category: announcement.category || "General",
        targetCourseIds: announcement.targetCourseIds || [],
        pinned: !!announcement.pinned,
        status: announcement.status || "published",
      });
    } else {
      setEditingId(null);
      resetForm();
    }
    setOpen(true);
  };

  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      targetCourseIds: prev.targetCourseIds.includes(courseId)
        ? prev.targetCourseIds.filter(id => id !== courseId)
        : [...prev.targetCourseIds, courseId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/announcements/${editingId}` : "/api/announcements";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(editingId ? "Announcement updated!" : "Announcement created!");
      setOpen(false);
      fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE", headers: headers() });
      toast.success("Deleted");
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-800";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getCourseNames = (targetCourseIds: string[]) => {
    if (!targetCourseIds || targetCourseIds.length === 0) return "All Students";
    if (targetCourseIds.includes("all")) return "All Students";
    return targetCourseIds
      .map(id => courses.find(c => c.id === id)?.title || id)
      .join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="h-8 w-8" />
          Announcements Management
        </h1>
        <Button onClick={() => handleOpen()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Announcement title"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                placeholder="Write the announcement..."
                rows={4}
                value={formData.content}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={formData.priority}
                  onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Target Courses */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen size={14} />
                Target Audience
                <span className="text-xs text-gray-400 font-normal">
                  (leave all unchecked = all students)
                </span>
              </Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all"
                    checked={formData.targetCourseIds.includes("all")}
                    onCheckedChange={(checked) =>
                      setFormData(p => ({
                        ...p,
                        targetCourseIds: checked ? ["all"] : [],
                      }))
                    }
                  />
                  <label htmlFor="all" className="text-sm font-medium cursor-pointer">All Students</label>
                </div>
                {courses.map(course => (
                  <div key={course.id} className="flex items-center gap-2">
                    <Checkbox
                      id={course.id}
                      checked={formData.targetCourseIds.includes(course.id)}
                      disabled={formData.targetCourseIds.includes("all")}
                      onCheckedChange={() => toggleCourse(course.id)}
                    />
                    <label htmlFor={course.id} className="text-sm cursor-pointer">{course.title}</label>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-sm text-gray-400">No courses created yet</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pinned"
                  checked={formData.pinned}
                  onCheckedChange={c => setFormData(p => ({ ...p, pinned: !!c }))}
                />
                <label htmlFor="pinned" className="text-sm cursor-pointer">Pin this announcement</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="draft"
                  checked={formData.status === "draft"}
                  onCheckedChange={c => setFormData(p => ({ ...p, status: c ? "draft" : "published" }))}
                />
                <label htmlFor="draft" className="text-sm cursor-pointer">Save as draft</label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <><Loader2 size={14} className="mr-2 animate-spin" />Saving...</> : editingId ? "Save Changes" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements ({announcements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : announcements.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No announcements yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className={`p-4 border rounded-lg hover:bg-gray-50 ${a.pinned ? "border-l-4 border-l-blue-500" : ""}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {a.pinned && <Pin size={14} className="text-blue-500" />}
                        <h3 className="font-semibold">{a.title}</h3>
                        <Badge className={getPriorityColor(a.priority)}>{a.priority}</Badge>
                        <Badge variant={a.status === "published" ? "default" : "secondary"}>{a.status}</Badge>
                        {a.category && <Badge variant="outline">{a.category}</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {getCourseNames(a.targetCourseIds)}
                        </span>
                        <span>by {a.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleOpen(a)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
