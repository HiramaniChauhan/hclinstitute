import { useEffect, useState } from "react";
import { Bell, CheckCheck, Info, ShieldAlert, BookOpen, DollarSign, Trophy } from "lucide-react";
import { fetchMyNotifications, markAllNotificationsRead } from "@/api/portalApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type NotifType = "announcement" | "verification" | "suspension" | "batch" | "result" | "fee" | "general";

interface Notification {
    notificationId: string;
    title: string;
    message: string;
    type: NotifType;
    isRead: boolean;
    createdAt: string;
}

const typeIcon = (type: NotifType) => {
    switch (type) {
        case "verification": return <ShieldAlert className="h-4 w-4 text-green-500" />;
        case "suspension": return <ShieldAlert className="h-4 w-4 text-red-500" />;
        case "batch": return <BookOpen className="h-4 w-4 text-blue-500" />;
        case "result": return <Trophy className="h-4 w-4 text-yellow-500" />;
        case "fee": return <DollarSign className="h-4 w-4 text-orange-500" />;
        default: return <Info className="h-4 w-4 text-indigo-500" />;
    }
};

const typeBadgeColor = (type: NotifType) => {
    switch (type) {
        case "verification": return "bg-green-100 text-green-700";
        case "suspension": return "bg-red-100 text-red-700";
        case "batch": return "bg-blue-100 text-blue-700";
        case "fee": return "bg-orange-100 text-orange-700";
        case "result": return "bg-yellow-100 text-yellow-700";
        default: return "bg-gray-100 text-gray-700";
    }
};

export const Notifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchMyNotifications();
            setNotifications(data);
        } catch {
            toast({ title: "Error", description: "Failed to load notifications", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast({ title: "All notifications marked as read" });
        } catch {
            toast({ title: "Error", description: "Failed to mark as read", variant: "destructive" });
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6 text-indigo-500" />
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    {unreadCount > 0 && (
                        <Badge className="bg-indigo-600 text-white">{unreadCount} new</Badge>
                    )}
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                        <CheckCheck className="h-4 w-4 mr-2" /> Mark all read
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No notifications yet</p>
                        <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map(n => (
                        <Card
                            key={n.notificationId}
                            className={`transition-all border-l-4 ${n.isRead
                                    ? "border-l-gray-200 opacity-70"
                                    : "border-l-indigo-500 shadow-md"
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">{typeIcon(n.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${typeBadgeColor(n.type)}`}>
                                                {n.type}
                                            </span>
                                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />}
                                        </div>
                                        <p className="font-semibold text-sm mt-1">{n.title}</p>
                                        <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(n.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
