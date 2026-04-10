import { useEffect, useState, useCallback } from "react";
import { getMaskedSuperAdminEmail } from "@/utils/maskEmail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Search, Trash2, Shield, ShieldCheck, Mail, Phone, RefreshCw,
    Loader2, KeyRound, AlertTriangle, UserCog
} from "lucide-react";
import { fetchAllAdmins, requestAdminDeleteOtp, deleteAdminWithOtp } from "@/api/portalApi";
import { useToast } from "@/hooks/use-toast";

interface Admin {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    createdAt: string;
}

export const AdminManagement = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
    const [otpStep, setOtpStep] = useState<"confirm" | "otp" | null>(null);
    const [otp, setOtp] = useState("");
    const [otpSending, setOtpSending] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { toast } = useToast();

    // Get current admin's ID from sessionStorage token
    const getCurrentAdminId = () => {
        try {
            const token = sessionStorage.getItem("token");
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.id;
        } catch {
            return null;
        }
    };

    const currentAdminId = getCurrentAdminId();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllAdmins();
            setAdmins(data);
        } catch {
            toast({ title: "Error", description: "Failed to load admins", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { load(); }, [load]);

    const filtered = admins.filter(a =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openDeleteDialog = (admin: Admin) => {
        setDeleteTarget(admin);
        setOtpStep("confirm");
        setOtp("");
    };

    const closeDeleteDialog = () => {
        setDeleteTarget(null);
        setOtpStep(null);
        setOtp("");
    };

    const sendDeleteOtp = async () => {
        if (!deleteTarget) return;
        setOtpSending(true);
        try {
            await requestAdminDeleteOtp(deleteTarget.id);
            toast({ title: "OTP Sent", description: "Verification OTP has been sent to the Super Admin email." });
            setOtpStep("otp");
        } catch (e: any) {
            let msg = "Failed to send OTP";
            try { msg = JSON.parse(e.message)?.error || msg; } catch { msg = e.message || msg; }
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setOtpSending(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !otp) return;
        setDeleteLoading(true);
        try {
            const result = await deleteAdminWithOtp(deleteTarget.id, otp);
            toast({ title: "Admin Deleted", description: result.message || "Admin has been permanently removed." });
            closeDeleteDialog();
            load();
        } catch (e: any) {
            let msg = "Failed to delete admin";
            try { msg = JSON.parse(e.message)?.error || msg; } catch { msg = e.message || msg; }
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-amber-500" />
                    <h1 className="text-2xl font-bold">Admin Management</h1>
                </div>
                <Button variant="outline" size="sm" onClick={load}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Shield className="h-8 w-8 text-amber-400" />
                        <div>
                            <p className="text-xs text-gray-500">Total Admins</p>
                            <p className="text-2xl font-bold">{admins.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4 flex items-center gap-3">
                        <ShieldCheck className="h-8 w-8 text-blue-400" />
                        <div>
                            <p className="text-xs text-gray-500">Super Admin</p>
                            <p className="text-sm font-semibold text-gray-700 truncate">{getMaskedSuperAdminEmail()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Super admin OTP notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <KeyRound className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-semibold">OTP Secured Deletion</p>
                    <p>To delete any admin, a verification OTP will be sent to the <strong>Super Admin email</strong> ({getMaskedSuperAdminEmail()}). You cannot delete your own account.</p>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle>All Administrators</CardTitle>
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
                            {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {admins.length === 0
                                ? "No admins found."
                                : `No admins matching "${searchTerm}"`}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map(admin => {
                                const isSelf = admin.id === currentAdminId;
                                return (
                                    <div key={admin.id} className={`p-4 border rounded-xl transition-colors ${isSelf ? 'bg-blue-50/50 border-blue-200' : 'hover:bg-gray-50'}`}>
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg ${isSelf ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {admin.name?.charAt(0).toUpperCase() || "A"}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold">{admin.name}</p>
                                                        {isSelf && (
                                                            <Badge className="bg-blue-100 text-blue-700 text-xs">You</Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />{admin.email}
                                                        </span>
                                                        {admin.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />{admin.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        Joined {new Date(admin.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isSelf ? (
                                                    <Badge variant="outline" className="text-gray-400 border-gray-300 cursor-not-allowed">
                                                        <UserCog className="h-3.5 w-3.5 mr-1" /> Cannot Delete Self
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => openDeleteDialog(admin)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation + OTP Dialog */}
            <Dialog open={!!deleteTarget && !!otpStep} onOpenChange={(open) => !open && closeDeleteDialog()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            {otpStep === "confirm" ? "Confirm Admin Deletion" : "Enter OTP Verification"}
                        </DialogTitle>
                        <DialogDescription>
                            {otpStep === "confirm"
                                ? `You are about to delete admin "${deleteTarget?.name}". A verification OTP will be sent to the Super Admin email.`
                                : `Enter the 6-digit OTP sent to the Super Admin email (${getMaskedSuperAdminEmail()}).`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {otpStep === "confirm" && (
                        <div className="space-y-4 py-2">
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                <p className="font-semibold mb-1">⚠️ This action is permanent</p>
                                <p>Admin <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) will be permanently removed from the system.</p>
                            </div>
                            <DialogFooter className="flex gap-2">
                                <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    onClick={sendDeleteOtp}
                                    disabled={otpSending}
                                >
                                    {otpSending ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending OTP...</>
                                    ) : (
                                        <><KeyRound className="h-4 w-4 mr-2" /> Send OTP & Proceed</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}

                    {otpStep === "otp" && (
                        <div className="space-y-4 py-2">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                <p>A 6-digit verification code has been sent to <strong>{getMaskedSuperAdminEmail()}</strong>. It is valid for 10 minutes.</p>
                            </div>
                            <Input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="text-center text-2xl tracking-[0.5em] font-mono"
                                maxLength={6}
                                autoFocus
                            />
                            <DialogFooter className="flex gap-2">
                                <Button variant="outline" onClick={closeDeleteDialog}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    onClick={confirmDelete}
                                    disabled={deleteLoading || otp.length !== 6}
                                >
                                    {deleteLoading ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
                                    ) : (
                                        <><Trash2 className="h-4 w-4 mr-2" /> Confirm Delete</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
