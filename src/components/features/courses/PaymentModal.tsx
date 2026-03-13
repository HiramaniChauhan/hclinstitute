import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Lock, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
    open: boolean;
    course: any;
    onClose: () => void;
    onSuccess: () => void;
}

// Extend the Window interface for Razorpay
declare global {
    interface Window {
        Razorpay: any;
    }
}

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const PaymentModal = ({ open, course, onClose, onSuccess }: PaymentModalProps) => {
    const [loading, setLoading] = useState(false);

    if (!course) return null;

    const isFree = !course.price || Number(course.price) === 0;

    const handleEnroll = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };

            // Step 1: Create order (or directly enroll for free courses)
            const orderRes = await fetch("/api/payments/create-order", {
                method: "POST",
                headers,
                body: JSON.stringify({ courseId: course.id }),
            });
            const orderData = await orderRes.json();
            if (!orderRes.ok) {
                toast.error(orderData.error || "Failed to initiate payment");
                return;
            }

            // Free course — enrolled directly, no payment needed
            if (orderData.free) {
                toast.success("Enrolled successfully! 🎉");
                window.dispatchEvent(new CustomEvent("enrollment-updated"));
                onSuccess();
                onClose();
                return;
            }

            // Step 2: Load Razorpay script
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error("Failed to load payment gateway. Check your internet connection.");
                return;
            }

            // Step 3: Open Razorpay checkout popup
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "HCL Institute",
                description: `Enrollment: ${course.title}`,
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    // Step 4: Verify payment signature on backend
                    const verifyRes = await fetch("/api/payments/verify", {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            courseId: course.id,
                            amount: orderData.amount,
                        }),
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyRes.ok && verifyData.success) {
                        toast.success("Payment successful! You are now enrolled. 🎉");
                        window.dispatchEvent(new CustomEvent("enrollment-updated"));
                        onSuccess();
                        onClose();
                    } else {
                        toast.error(verifyData.error || "Payment verification failed. Contact support.");
                    }
                },
                prefill: {
                    name: orderData.userName || "",
                    email: orderData.userEmail || ""
                },
                theme: { color: "#2563eb" },
                modal: { ondismiss: () => setLoading(false) },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            console.error("Enroll error:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {isFree ? "Enroll for Free" : "Complete Enrollment"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Course image */}
                    {course.profilePicData && (
                        <img
                            src={course.profilePicData}
                            alt={course.title}
                            className="w-full h-40 object-cover rounded-lg"
                        />
                    )}

                    <div>
                        <h3 className="font-semibold text-lg">{course.title}</h3>
                        {course.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                        )}
                    </div>

                    {/* Access features */}
                    {course.accessFeatures && course.accessFeatures.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">What you get</p>
                            <div className="flex flex-wrap gap-2">
                                {course.accessFeatures.map((feat: string, i: number) => (
                                    <div key={i} className="flex items-center gap-1 text-sm text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                                        <CheckCircle size={13} />
                                        {feat}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Price */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
                        <span className="text-gray-600 font-medium">Total Amount</span>
                        <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                            {isFree ? (
                                <Badge className="text-lg px-3 py-1 bg-green-100 text-green-700">FREE</Badge>
                            ) : (
                                <>
                                    <IndianRupee size={22} />
                                    {Number(course.price).toLocaleString()}
                                </>
                            )}
                        </div>
                    </div>

                    {!isFree && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Lock size={11} />
                            Secure payment via Razorpay — UPI, Cards, NetBanking supported
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                        onClick={handleEnroll}
                        disabled={loading}
                    >
                        {loading ? (
                            <><Loader2 size={16} className="mr-2 animate-spin" />Processing...</>
                        ) : isFree ? (
                            "Enroll for Free"
                        ) : (
                            <><IndianRupee size={15} className="mr-1" />Pay & Enroll</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
