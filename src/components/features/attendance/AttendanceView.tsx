import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";
import { fetchMyAttendance } from "@/api/portalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
    attendanceId: string;
    batchId: string;
    lectureId?: string;
    date: string;
    status: "present" | "absent" | "late";
    notes?: string;
}

interface AttendanceSummary {
    total: number;
    present: number;
    late: number;
    absent: number;
    percentage: number;
}

const statusConfig = {
    present: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, label: "Present", color: "bg-green-100 text-green-700" },
    late: { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: "Late", color: "bg-yellow-100 text-yellow-700" },
    absent: { icon: <XCircle className="h-4 w-4 text-red-500" />, label: "Absent", color: "bg-red-100 text-red-700" },
};

export const AttendanceView = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<AttendanceSummary>({ total: 0, present: 0, late: 0, absent: 0, percentage: 0 });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchMyAttendance();
                setRecords(data.records || []);
                setSummary(data.summary || { total: 0, present: 0, late: 0, absent: 0, percentage: 0 });
            } catch {
                toast({ title: "Error", description: "Failed to load attendance", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const percentageColor = summary.percentage >= 75 ? "text-green-600" : summary.percentage >= 60 ? "text-yellow-600" : "text-red-600";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <CalendarCheck className="h-6 w-6 text-teal-500" />
                <h1 className="text-2xl font-bold">My Attendance</h1>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Card className="sm:col-span-1 border-l-4 border-l-teal-500">
                    <CardContent className="p-4">
                        <p className="text-xs text-gray-500">Attendance %</p>
                        <p className={`text-3xl font-bold mt-1 ${percentageColor}`}>{summary.percentage}%</p>
                        {summary.percentage < 75 && (
                            <p className="text-xs text-red-500 mt-1">Below required 75%</p>
                        )}
                    </CardContent>
                </Card>
                {[
                    { label: "Total", value: summary.total, color: "border-l-indigo-500" },
                    { label: "Present", value: summary.present, color: "border-l-green-500" },
                    { label: "Late", value: summary.late, color: "border-l-yellow-500" },
                    { label: "Absent", value: summary.absent, color: "border-l-red-500" },
                ].map(({ label, value, color }) => (
                    <Card key={label} className={`border-l-4 ${color}`}>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="text-2xl font-bold mt-1">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-gray-200 animate-pulse" />
                    ))}
                </div>
            ) : records.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <CalendarCheck className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No attendance records yet</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" /> Attendance History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {records.map(r => {
                                const config = statusConfig[r.status];
                                return (
                                    <div key={r.attendanceId} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {config.icon}
                                            <div>
                                                <p className="font-medium text-sm">{new Date(r.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</p>
                                                {r.lectureId && <p className="text-xs text-gray-400">Lecture ID: {r.lectureId}</p>}
                                                {r.notes && <p className="text-xs text-gray-400 italic">{r.notes}</p>}
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
