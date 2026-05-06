
import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Search, Trash2, ShieldCheck, ShieldOff, Users, Activity,
    CheckCircle, XCircle, Mail, UserCog, Bell, RefreshCw, FileText,
    BookOpen, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { StudentDetail } from "./StudentDetail";
import {
    fetchAllStudents, verifyStudent, unverifyStudent, suspendStudent, unsuspendStudent,
    deleteStudent, broadcastNotification, fetchStudentEnrollments, adminEnrollStudent, unenroll, fetchCourses, restoreStudent, permanentlyDeleteStudent
} from "@/api/portalApi";
import { useToast } from "@/hooks/use-toast";

interface Course {
    id: string;
    title: string;
    price: number;
}

interface Enrollment {
    enrollmentId: string;
    userId: string;
    courseId?: string;
    enrolledAt: string;
    status: string;
}

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
    aadharPhoto?: string;
    marksheet10th?: string;
    isDeleted?: boolean;
    deletedAt?: string;
}

export const StudentManagement = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [suspendDialog, setSuspendDialog] = useState<Student | null>(null);
    const [suspendReason, setSuspendReason] = useState("");
    const [deleteDialog, setDeleteDialog] = useState<Student | null>(null);
    const [permanentDeleteDialog, setPermanentDeleteDialog] = useState<Student | null>(null);
    const [broadcastDialog, setBroadcastDialog] = useState(false);
    const [photoDialog, setPhotoDialog] = useState<{ title: string, url: string } | null>(null);
    const [broadcast, setBroadcast] = useState({ title: "", message: "" });
    const [courseDialogStudent, setCourseDialogStudent] = useState<Student | null>(null);
    const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [viewMode, setViewMode] = useState<"active" | "deleted">("active");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [stats, setStats] = useState({ totalAll: 0, verifiedCount: 0, suspendedCount: 0 });
    const { toast } = useToast();
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search input
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 400);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [searchTerm]);

    const load = useCallback(async (page = currentPage, search = debouncedSearch) => {
        setLoading(true);
        try {
            const data = await fetchAllStudents({ page, limit: 50, search: search || undefined });
            setStudents(data.students);
            setPagination(data.pagination);
            if (data.stats) setStats(data.stats);
        } catch {
            toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast, currentPage, debouncedSearch]);

    useEffect(() => { load(currentPage, debouncedSearch); }, [currentPage, debouncedSearch]);

    // Filter by viewMode client-side (active vs deleted) from the current page
    const filtered = students.filter(s => {
        const matchesView = viewMode === "active" ? !s.isDeleted : !!s.isDeleted;
        return matchesView;
    });

    const doVerify = async (student: Student) => {
        setActionLoading(student.id);
        try {
            await verifyStudent(student.id);
            toast({ title: `${student.name} verified!` });
            load(currentPage, debouncedSearch);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const doUnverify = async (student: Student) => {
        setActionLoading(student.id);
        try {
            await unverifyStudent(student.id);
            toast({ title: `${student.name} unverified.` });
            load(currentPage, debouncedSearch);
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
            load(currentPage, debouncedSearch);
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
            load(currentPage, debouncedSearch);
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
            toast({ title: `${deleteDialog.name} moved to deleted accounts` });
            setDeleteDialog(null);
            load(currentPage, debouncedSearch);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const doPermanentDelete = async () => {
        if (!permanentDeleteDialog) return;
        setActionLoading(permanentDeleteDialog.id);
        try {
            await permanentlyDeleteStudent(permanentDeleteDialog.id);
            toast({ title: `${permanentDeleteDialog.name} permanently deleted` });
            setPermanentDeleteDialog(null);
            load(currentPage, debouncedSearch);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const doRestore = async (student: Student) => {
        setActionLoading(student.id);
        try {
            await restoreStudent(student.id);
            toast({ title: `${student.name} restored` });
            load(currentPage, debouncedSearch);
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

    const loadStudentEnrollments = async (studentId: string) => {
        try {
            const data = await fetchStudentEnrollments(studentId);
            setStudentEnrollments(data);
        } catch (e: any) {
            toast({ title: "Error", description: "Failed to load enrollments", variant: "destructive" });
        }
    };

    const openCourseDialog = async (student: Student) => {
        setCourseDialogStudent(student);
        setEnrollLoading(true);
        try {
            await Promise.all([
                loadStudentEnrollments(student.id),
                fetchCourses().then(setAllCourses)
            ]);
        } catch (e: any) {
            toast({ title: "Error", description: "Failed to load course data", variant: "destructive" });
        } finally {
            setEnrollLoading(false);
        }
    };

    const doEnroll = async (courseId: string) => {
        if (!courseDialogStudent) return;
        setEnrollLoading(true);
        try {
            await adminEnrollStudent({ userId: courseDialogStudent.id, courseId });
            toast({ title: "Student enrolled successfully" });
            await loadStudentEnrollments(courseDialogStudent.id);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setEnrollLoading(false);
        }
    };

    const doUnenroll = async (enrollmentId: string) => {
        if (!courseDialogStudent) return;
        if (!confirm("Are you sure you want to remove this course?")) return;
        setEnrollLoading(true);
        try {
            await unenroll(enrollmentId);
            toast({ title: "Course removed" });
            await loadStudentEnrollments(courseDialogStudent.id);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setEnrollLoading(false);
        }
    };

    const verified = stats.verifiedCount;
    const suspended = stats.suspendedCount;

    const handleBack = useCallback(() => {
        setSelectedStudentId(null);
        load(currentPage, debouncedSearch);
    }, [load, currentPage, debouncedSearch]);

    if (selectedStudentId) {
        return <StudentDetail studentId={selectedStudentId} onBack={handleBack} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-indigo-500" />
                    <h1 className="text-2xl font-bold">Student Management</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => load(currentPage, debouncedSearch)}>
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
                        <div><p className="text-xs text-gray-500">Total Students</p><p className="text-2xl font-bold">{stats.totalAll}</p></div>
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
                        <div className="flex items-center gap-4">
                            <CardTitle>Students {debouncedSearch && <span className="text-sm font-normal text-gray-500 ml-2">({pagination.total} results for "{debouncedSearch}")</span>}</CardTitle>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <Button
                                    size="sm"
                                    variant={viewMode === "active" ? "default" : "ghost"}
                                    onClick={() => setViewMode("active")}
                                    className={viewMode === "active" ? "bg-white text-black shadow-sm" : "text-gray-500"}
                                >
                                    Active Students
                                </Button>
                                <Button
                                    size="sm"
                                    variant={viewMode === "deleted" ? "default" : "ghost"}
                                    onClick={() => setViewMode("deleted")}
                                    className={viewMode === "deleted" ? "bg-white text-black shadow-sm" : "text-gray-500"}
                                >
                                    Deleted Accounts
                                </Button>
                            </div>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            {searchTerm && loading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 animate-spin" />}
                            <Input
                                placeholder="Search all students by name or email..."
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
                            {pagination.total === 0 && !debouncedSearch
                                ? "No students registered yet. Students who register will appear here."
                                : debouncedSearch
                                    ? `No students matching "${debouncedSearch}" across all records`
                                    : `No ${viewMode} students on this page`}
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
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                            >
                                                <FileText className="h-4 w-4 mr-1" /> Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openCourseDialog(student)}
                                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                            >
                                                <BookOpen className="h-4 w-4 mr-1" /> Courses
                                            </Button>
                                            {student.aadharPhoto && !student.isVerified && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setPhotoDialog({ title: "Aadhar Photo", url: student.aadharPhoto! })}
                                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                >
                                                    View Aadhar
                                                </Button>
                                            )}
                                            {student.marksheet10th && !student.isVerified && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setPhotoDialog({ title: "10th Marksheet", url: student.marksheet10th! })}
                                                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                                                >
                                                    View 10th Result
                                                </Button>
                                            )}
                                            {!student.isDeleted && !student.isVerified && (
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
                                            {!student.isDeleted && student.isVerified && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => doUnverify(student)}
                                                    disabled={actionLoading === student.id}
                                                    className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                                                >
                                                    <ShieldOff className="h-4 w-4 mr-1" /> Unverify
                                                </Button>
                                            )}
                                            {!student.isDeleted && !student.isSuspended && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setSuspendDialog(student)}
                                                    disabled={actionLoading === student.id}
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    <ShieldOff className="h-4 w-4 mr-1" /> Suspend
                                                </Button>
                                            )}
                                            {!student.isDeleted && student.isSuspended && (
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
                                            {student.isDeleted ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => doRestore(student)}
                                                        disabled={actionLoading === student.id}
                                                        className="border-green-200 text-green-600 hover:bg-green-50"
                                                    >
                                                        <RefreshCw className="h-4 w-4 mr-1" /> Restore
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setPermanentDeleteDialog(student)}
                                                        disabled={actionLoading === student.id}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete Permanently
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => setDeleteDialog(student)}
                                                    disabled={actionLoading === student.id}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-6 border-t mt-6">
                            <p className="text-sm text-gray-500">
                                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
                                {debouncedSearch && ` matching "${debouncedSearch}"`}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1 || loading}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || loading}
                                    className="h-8 px-3"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                </Button>
                                <div className="flex items-center gap-1 px-2">
                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (pagination.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= pagination.totalPages - 2) {
                                            pageNum = pagination.totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={pageNum === currentPage ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                disabled={loading}
                                                className={`h-8 w-8 p-0 ${pageNum === currentPage ? "bg-indigo-600 text-white hover:bg-indigo-700" : ""}`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={currentPage === pagination.totalPages || loading}
                                    className="h-8 px-3"
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(pagination.totalPages)}
                                    disabled={currentPage === pagination.totalPages || loading}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                    {pagination.totalPages <= 1 && pagination.total > 0 && (
                        <p className="text-sm text-gray-400 text-center pt-4">
                            Showing all {pagination.total} students
                        </p>
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
                    <p className="text-sm text-gray-500">This will move the student's account to the Deleted Accounts list.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={doDelete}>Yes, Remove</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permanent Delete Dialog */}
            <Dialog open={!!permanentDeleteDialog} onOpenChange={(open) => !open && setPermanentDeleteDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permanently Delete {permanentDeleteDialog?.name}?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-red-600 font-semibold">Warning: This action is irreversible. It will permanently remove the student and all associated data from the database.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPermanentDeleteDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={doPermanentDelete}>Yes, Delete Permanently</Button>
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

            {/* Photo Viewing Dialog */}
            <Dialog open={!!photoDialog} onOpenChange={(open) => !open && setPhotoDialog(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{photoDialog?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-2 bg-gray-50 rounded-lg min-h-[300px]">
                        {photoDialog && (
                            <img
                                src={photoDialog.url}
                                alt={photoDialog.title}
                                className="max-w-full max-h-[70vh] object-contain rounded"
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPhotoDialog(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Course Enrollment Dialog */}
            <Dialog open={!!courseDialogStudent} onOpenChange={(open) => !open && setCourseDialogStudent(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage Courses: {courseDialogStudent?.name}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Current Enrollments */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-indigo-500" />
                                Current Enrollments
                            </h3>
                            {enrollLoading ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                            ) : studentEnrollments.filter(en => allCourses.some(c => c.id === en.courseId)).length === 0 ? (
                                <p className="text-sm text-gray-500 italic py-2">No active enrollments found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {studentEnrollments
                                        .filter(en => allCourses.some(c => c.id === en.courseId))
                                        .map(en => {
                                            const course = allCourses.find(c => c.id === en.courseId);
                                            return (
                                                <div key={en.enrollmentId} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                                    <div>
                                                        <p className="font-medium text-sm">{course?.title || "Unknown Course"}</p>
                                                        <p className="text-xs text-gray-500">Enrolled: {new Date(en.enrolledAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => doUnenroll(en.enrollmentId)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        <hr />

                        {/* Assign New Course */}
                        <div>
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Plus className="h-4 w-4 text-green-500" />
                                Assign New Course
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                                {allCourses.filter(c => !studentEnrollments.some(e => e.courseId === c.id)).map(course => (
                                    <div key={course.id} className="p-2 border rounded-md flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <span className="text-sm truncate">{course.title}</span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-2"
                                            onClick={() => doEnroll(course.id)}
                                            disabled={enrollLoading}
                                        >
                                            {enrollLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCourseDialogStudent(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};
