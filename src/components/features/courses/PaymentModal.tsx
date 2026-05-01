import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IndianRupee, Lock, CheckCircle, Loader2, ShieldCheck, CreditCard, Smartphone, Building2, X } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
    open: boolean;
    course: any;
    onClose: () => void;
    onSuccess: () => void;
}

declare global {
    interface Window { Razorpay: any; }
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

const PaymentMethod = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs">
        {icon}
        <span>{label}</span>
    </div>
);

export const PaymentModal = ({ open, course, onClose, onSuccess }: PaymentModalProps) => {
    const [loading, setLoading] = useState(false);

    if (!course) return null;

    const isFree = !course.price || Number(course.price) === 0;
    const priceDisplay = Number(course.price).toLocaleString("en-IN");

    const handleEnroll = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem("token");
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };

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

            if (orderData.free) {
                toast.success("Enrolled successfully! 🎉");
                window.dispatchEvent(new CustomEvent("enrollment-updated"));
                onSuccess();
                onClose();
                return;
            }

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                toast.error("Failed to load payment gateway. Check your internet connection.");
                return;
            }

            // Build absolute logo URL for Razorpay
            const logoUrl = `${window.location.origin}/logo.png`;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "HCL Institute",
                description: `Course: ${course.title}`,
                image: logoUrl,
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    try {
                        setLoading(true);
                        toast.info("Verifying your payment, please wait...");
                        console.log("[Payment] Razorpay handler fired. Verifying...", {
                            order_id: response.razorpay_order_id,
                            payment_id: response.razorpay_payment_id,
                            courseId: course.id,
                        });

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
                        console.log("[Payment] Verify response:", verifyRes.status, verifyData);

                        if (verifyRes.ok && verifyData.success) {
                            toast.success("Payment successful! You are now enrolled. 🎉");
                            window.dispatchEvent(new CustomEvent("enrollment-updated"));
                            // Small delay to let the DB write propagate before re-fetching
                            await new Promise(r => setTimeout(r, 500));
                            onSuccess();
                            onClose();
                        } else {
                            console.error("[Payment] Verification failed:", verifyData);
                            toast.error(verifyData.error || "Payment verification failed. Contact support.");
                        }
                    } catch (error) {
                        console.error("[Payment] Verification network error:", error);
                        toast.error("Failed to reach server for verification. Please contact support with your payment ID.");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: orderData.userName || "",
                    email: orderData.userEmail || "",
                    contact: orderData.userPhone || "",
                },
                theme: {
                    color: "#e6873c",   // HCL Institute orange from logo ring
                    hide_topbar: false,
                },
                modal: {
                    ondismiss: () => setLoading(false),
                    animation: true,
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error("Razorpay payment failed:", response.error);
                toast.error(response.error?.description || "Payment failed at gateway. Please try again.");
            });
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
            <DialogContent className="p-0 max-w-md border-0 overflow-hidden bg-transparent shadow-2xl">
                <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, #1a1a1a 0%, #111111 100%)" }}>

                    {/* ── Header: HCL Institute branding ───────────────────── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10"
                        style={{ background: "linear-gradient(135deg, #1f1f1f 0%, #1a1a1a 100%)" }}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-lg"
                                    style={{ borderColor: "#e6873c" }}>
                                    <img src="/logo.png" alt="HCL Institute" className="w-full h-full object-cover" />
                                </div>
                                {/* Orange glow ring */}
                                <div className="absolute inset-0 rounded-full"
                                    style={{ boxShadow: "0 0 12px 2px rgba(230,135,60,0.4)" }} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-base tracking-wide">HCL Institute</p>
                                <p className="text-white/40 text-xs">Secure Enrollment</p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-full hover:bg-white/10">
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── Course Info ───────────────────────────────────────── */}
                    <div className="px-6 pt-5 pb-4">
                        {course.profilePicData && (
                            <div className="mb-4 rounded-xl overflow-hidden h-36 w-full">
                                <img src={course.profilePicData} alt={course.title}
                                    className="w-full h-full object-cover opacity-90" />
                            </div>
                        )}

                        <h2 className="text-white font-bold text-lg leading-snug mb-1">{course.title}</h2>
                        {course.description && (
                            <p className="text-white/50 text-sm line-clamp-2">{course.description}</p>
                        )}

                        {/* Features */}
                        {course.accessFeatures && course.accessFeatures.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1.5">
                                {course.accessFeatures.slice(0, 4).map((feat: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                                        <CheckCircle size={13} className="text-orange-400 shrink-0" />
                                        {feat}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Price Summary ─────────────────────────────────────── */}
                    <div className="mx-6 mb-4 rounded-xl border border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3"
                            style={{ background: "rgba(230,135,60,0.08)" }}>
                            <span className="text-white/60 text-sm font-medium">Total Amount</span>
                            {isFree ? (
                                <span className="text-green-400 font-bold text-xl">FREE</span>
                            ) : (
                                <div className="flex items-center gap-0.5 font-bold text-2xl text-white">
                                    <IndianRupee size={20} />
                                    <span>{priceDisplay}</span>
                                </div>
                            )}
                        </div>
                        {!isFree && (
                            <div className="flex items-center gap-2 px-4 py-2 border-t border-white/5">
                                <ShieldCheck size={12} className="text-green-400" />
                                <span className="text-white/40 text-xs">100% Secure Payment · SSL Encrypted</span>
                            </div>
                        )}
                    </div>

                    {/* ── Payment Methods ───────────────────────────────────── */}
                    {!isFree && (
                        <div className="px-6 mb-5">
                            <p className="text-white/30 text-xs uppercase tracking-widest mb-2.5">Accepted via Razorpay</p>
                            <div className="grid grid-cols-4 gap-2">
                                <PaymentMethod icon={<CreditCard size={16} />} label="Cards" />
                                <PaymentMethod icon={<Smartphone size={16} />} label="UPI" />
                                <PaymentMethod icon={<Building2 size={16} />} label="Net Banking" />
                                <PaymentMethod icon={<IndianRupee size={16} />} label="Wallets" />
                            </div>
                        </div>
                    )}

                    {/* ── Actions ───────────────────────────────────────────── */}
                    <div className="px-6 pb-6 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-none text-white/50 hover:text-white hover:bg-white/10 border border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEnroll}
                            disabled={loading}
                            className="flex-1 font-semibold text-white border-0 shadow-lg transition-all duration-200 hover:opacity-90 active:scale-95"
                            style={{
                                background: isFree
                                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                                    : "linear-gradient(135deg, #e6873c, #d4612a)",
                                boxShadow: isFree
                                    ? "0 4px 20px rgba(22,163,74,0.35)"
                                    : "0 4px 20px rgba(230,135,60,0.40)",
                            }}
                        >
                            {loading ? (
                                <><Loader2 size={16} className="mr-2 animate-spin" />Processing...</>
                            ) : isFree ? (
                                <><CheckCircle size={15} className="mr-1.5" />Enroll for Free</>
                            ) : (
                                <><IndianRupee size={15} className="mr-1" />Pay ₹{priceDisplay}</>
                            )}
                        </Button>
                    </div>

                    {/* ── Razorpay branding ──────────────────────────────────── */}
                    {!isFree && (
                        <div className="flex items-center justify-center gap-2 pb-4 text-white/20 text-xs">
                            <Lock size={10} />
                            <span>Powered by Razorpay · Secured by 256-bit SSL</span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
