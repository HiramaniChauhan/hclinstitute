import { useEffect, useState } from "react";
import { BookOpen, CheckCircle, Clock, XCircle } from "lucide-react";
import { fetchMyEnrollments, fetchMyFees, payFee } from "@/api/portalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FeeRecord {
    feeId: string;
    amount: number;
    description: string;
    dueDate: string;
    status: "pending" | "paid" | "overdue" | "waived";
    paidAt?: string;
    category: string;
    createdAt: string;
}

const statusColor = (status: string) => {
    if (status === "paid") return "bg-green-100 text-green-700";
    if (status === "waived") return "bg-blue-100 text-blue-700";
    if (status === "overdue") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700"; // pending
};

const statusIcon = (status: string) => {
    if (status === "paid") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "waived") return <CheckCircle className="h-4 w-4 text-blue-500" />;
    if (status === "overdue") return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
};

export const Fees = () => {
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [summary, setSummary] = useState({ totalAmount: 0, totalPaid: 0, totalPending: 0 });
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState<string | null>(null);
    const { toast } = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchMyFees();
            setFees(data.fees || []);
            setSummary(data.summary || { totalAmount: 0, totalPaid: 0, totalPending: 0 });
        } catch {
            toast({ title: "Error", description: "Failed to load fees", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handlePay = async (feeId: string) => {
        setPaying(feeId);
        try {
            await payFee(feeId);
            toast({ title: "Fee paid successfully!" });
            load();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setPaying(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-orange-500" />
                <h1 className="text-2xl font-bold">Fee Records</h1>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold mt-1">₹{summary.totalAmount.toLocaleString("en-IN")}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">₹{summary.totalPaid.toLocaleString("en-IN")}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Outstanding</p>
                        <p className="text-2xl font-bold text-yellow-600 mt-1">₹{summary.totalPending.toLocaleString("en-IN")}</p>
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
                    ))}
                </div>
            ) : fees.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No fee records yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {fees.map(fee => (
                        <Card key={fee.feeId} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        {statusIcon(fee.status)}
                                        <div>
                                            <p className="font-semibold">{fee.description}</p>
                                            <p className="text-sm text-gray-500 capitalize">{fee.category} · Due: {new Date(fee.dueDate).toLocaleDateString("en-IN")}</p>
                                            {fee.paidAt && (
                                                <p className="text-xs text-green-600">Paid on {new Date(fee.paidAt).toLocaleDateString("en-IN")}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-bold">₹{fee.amount.toLocaleString("en-IN")}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor(fee.status)}`}>
                                            {fee.status}
                                        </span>
                                        {(fee.status === "pending" || fee.status === "overdue") && (
                                            <Button
                                                size="sm"
                                                onClick={() => handlePay(fee.feeId)}
                                                disabled={paying === fee.feeId}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {paying === fee.feeId ? "Processing..." : "Pay Now"}
                                            </Button>
                                        )}
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
