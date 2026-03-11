import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar, Pin, Users, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/announcements/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setAnnouncements(await res.json());
        } else {
          toast.error("Failed to load announcements");
        }
      } catch {
        toast.error("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-800 border-red-200";
    if (priority === "medium") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      "Admission": "bg-blue-500",
      "Schedule": "bg-purple-500",
      "Holiday": "bg-orange-500",
      "Study Material": "bg-green-500",
      "Results": "bg-red-500",
      "Exam": "bg-indigo-500",
    };
    return map[category] || "bg-gray-500";
  };

  const pinned = announcements.filter(a => a.pinned);
  const rest = announcements.filter(a => !a.pinned);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Megaphone className="h-8 w-8" />
          Announcements
        </h1>
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No announcements yet</p>
            <p className="text-sm mt-1">Check back later for updates from your institute</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const AnnouncementCard = ({ a, highlighted = false }: { a: any; highlighted?: boolean }) => (
    <div className={`p-4 rounded-lg border ${highlighted ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          {a.pinned && <Pin className="h-4 w-4 text-blue-500 shrink-0" />}
          <Megaphone className={`h-4 w-4 shrink-0 ${highlighted ? "text-blue-600" : "text-gray-500"}`} />
          <h3 className="font-semibold text-base">{a.title}</h3>
        </div>
        <Badge className={`${getPriorityColor(a.priority)} ml-2 shrink-0`}>
          {a.priority.toUpperCase()}
        </Badge>
      </div>

      <p className="text-gray-700 mb-3 text-sm leading-relaxed">{a.content}</p>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span>by {a.author}</span>
        </div>
        <div className="flex items-center gap-2">
          {a.category && (
            <Badge variant="secondary" className={`${getCategoryColor(a.category)} text-white text-xs`}>
              {a.category}
            </Badge>
          )}
          {a.targetCourseIds && a.targetCourseIds.length > 0 && !a.targetCourseIds.includes("all") && (
            <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              <Users size={10} />
              Course-specific
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Megaphone className="h-8 w-8" />
        Announcements
      </h1>

      {/* Pinned */}
      {pinned.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Pin className="h-4 w-4 text-blue-500" />
              Pinned Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pinned.map(a => <AnnouncementCard key={a.id} a={a} highlighted />)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rest.map(a => <AnnouncementCard key={a.id} a={a} />)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
