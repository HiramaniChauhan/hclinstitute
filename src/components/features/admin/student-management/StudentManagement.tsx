
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Search, Trash2, ShieldCheck, ShieldOff, Users, Activity,
    CheckCircle, XCircle, Mail, UserCog, Bell, RefreshCw,
} from "lucide-react";
import {
    fetchAllStudents, verifyStudent, suspendStudent, unsuspendStudent,
    deleteStudent, broadcastNotification,
} from "@/api/portalApi";
import { useToast } from "@/hooks/use-toast";

interface Student {
    id: string;
    name: string;
    email: string;
    role: string;
    isVerified: boolean;
    isSuspended?: boolean;
    batchId?: string;
    batchName?: string;
    createdAt: string;
    aadharNumber?: string;
}

export const StudentManagement = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [suspendDialog, setSuspendDialog] = useState<Student | null>(null);
    const [suspendReason, setSuspendReason] = useState("");
    const [deleteDialog, setDeleteDialog] = useState<Student | null>(null);
    const [broadcastDialog, setBroadcastDialog] = useState(false);
    const [broadcast, setBroadcast] = useState({ title: "", message: "" });
    const { toast } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchAllStudents();
            setStudents(data);
        } catch {
            toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const doVerify = async (student: Student) => {
        setActionLoading(student.id);
        try {
            await verifyStudent(student.id);
            toast({ title: `${student.name} verified!` });
            load();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const doSuspend = async () => {
        if (!suspendDialog) return;
        setActionLoading(suspendDialog.id);
        try {
            await suspendStudent(suspendDialog.id, suspendReason);
            toast({ title: `${suspendDialog.name} suspended` });
            setSuspendDialog(null);
            setSuspendReason("");
            load();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const doUnsuspend = async (student: Student) => {
        setActionLoading(student.id);
        try {
            await unsuspendStudent(student.id);
            toast({ title: `${student.name} reinstated` });
            load();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const doDelete = async () => {
        if (!deleteDialog) return;
        setActionLoading(deleteDialog.id);
        try {
            await deleteStudent(deleteDialog.id);
            toast({ title: `${deleteDialog.name} removed` });
            setDeleteDialog(null);
            load();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const doBroadcast = async () => {
        if (!broadcast.title || !broadcast.message) return;
        try {
            const res = await broadcastNotification(broadcast.title, broadcast.message, "announcement");
            toast({ title: res.message || "Broadcast sent!" });
            setBroadcastDialog(false);
            setBroadcast({ title: "", message: "" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const verified = students.filter(s => s.isVerified).length;
    const suspended = students.filter(s => s.isSuspended).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-indigo-500" />
                    <h1 className="text-2xl font-bold">Student Management</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={load}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Button size="sm" onClick={() => setBroadcastDialog(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Bell className="h-4 w-4 mr-2" /> Broadcast
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Users className="h-8 w-8 text-indigo-400" />
                        <div><p className="text-xs text-gray-500">Total Students</p><p className="text-2xl font-bold">{students.length}</p></div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-400" />
                        <div><p className="text-xs text-gray-500">Verified</p><p className="text-2xl font-bold">{verified}</p></div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <XCircle className="h-8 w-8 text-red-400" />
                        <div><p className="text-xs text-gray-500">Suspended</p><p className="text-2xl font-bold">{suspended}</p></div>
                    </CardContent>
                </Card>
            </div>

            {/* Search + Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle>All Students</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email"
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {students.length === 0
                                ? "No students registered yet. Students who register will appear here."
                                : `No students matching "${searchTerm}"`}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map(student => (
                                <div key={student.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{student.name}</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <Mail className="h-3 w-3" />{student.email}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant={student.isVerified ? "default" : "outline"} className={student.isVerified ? "bg-green-500 text-white" : ""}>
                                                        {student.isVerified ? "Verified" : "Unverified"}
                                                    </Badge>
                                                    {student.isSuspended && (
                                                        <Badge className="bg-red-100 text-red-700">Suspended</Badge>
                                                    )}
                                                    {student.batchName && (
                                                        <Badge variant="outline">{student.batchName}</Badge>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        Joined {new Date(student.createdAt).toLocaleDateString("en-IN")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {!student.isVerified && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => doVerify(student)}
                                                    disabled={actionLoading === student.id}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <ShieldCheck className="h-4 w-4 mr-1" />
                                                    {actionLoading === student.id ? "..." : "Verify"}
                                                </Button>
                                            )}
                                            {!student.isSuspended ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSuspendDialog(student)}
                                                    disabled={actionLoading === student.id}
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    <ShieldOff className="h-4 w-4 mr-1" /> Suspend
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => doUnsuspend(student)}
                                                    disabled={actionLoading === student.id}
                                                    className="border-green-200 text-green-600 hover:bg-green-50"
                                                >
                                                    <ShieldCheck className="h-4 w-4 mr-1" /> Reinstate
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => setDeleteDialog(student)}
                                                disabled={actionLoading === student.id}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Suspend Dialog */}
            <Dialog open={!!suspendDialog} onOpenChange={(open) => !open && setSuspendDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspend {suspendDialog?.name}?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500">The student will be notified and blocked from accessing the platform.</p>
                    <Input
                        placeholder="Reason for suspension (optional)"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={doSuspend}>Confirm Suspend</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove {deleteDialog?.name}?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-500">This will permanently delete the student's account. This cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={doDelete}>Yes, Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Broadcast Dialog */}
            <Dialog open={broadcastDialog} onOpenChange={setBroadcastDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Broadcast Notification to All Students</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder="Notification title"
                            value={broadcast.title}
                            onChange={(e) => setBroadcast(b => ({ ...b, title: e.target.value }))}
                        />
                        <textarea
                            className="w-full p-2 border rounded-md text-sm resize-none h-24"
                            placeholder="Message to students..."
                            value={broadcast.message}
                            onChange={(e) => setBroadcast(b => ({ ...b, message: e.target.value }))}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBroadcastDialog(false)}>Cancel</Button>
                        <Button onClick={doBroadcast} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Bell className="h-4 w-4 mr-2" /> Send to All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
