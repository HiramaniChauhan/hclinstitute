
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from './AuthProvider';
import { KeyRound, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: 'student' | 'admin';
}

export const ForgotPasswordModal = ({ isOpen, onClose, role }: ForgotPasswordModalProps) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { requestPasswordReset, verifyResetOtp, resetPassword } = useAuth();

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await requestPasswordReset(email, role);
        setLoading(false);
        if (success) {
            setStep(2);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await verifyResetOtp(email, otp);
        setLoading(false);
        if (success) {
            setStep(3);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return;
        }
        setLoading(true);
        const success = await resetPassword({ email, otp, newPassword, role });
        setLoading(false);
        if (success) {
            onClose();
            // Reset state
            setStep(1);
            setEmail('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-primary" />
                        Forgot Password
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Enter your email to receive a password reset OTP."}
                        {step === 2 && `Enter the OTP sent to ${email}`}
                        {step === 3 && "Set your new password."}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <form onSubmit={handleRequestOtp} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    className="pl-9"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </Button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="otp">Enter 6-Digit OTP</Label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="000000"
                                    className="pl-9 tracking-[0.5em] font-mono text-center"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-xs"
                            onClick={() => setStep(1)}
                            type="button"
                        >
                            Wrong email? Back
                        </Button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">enter atleast 6 charector</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">enter atleast 6 charector</p>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-destructive">Passwords do not match</p>
                            )}
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !newPassword || newPassword !== confirmPassword}
                        >
                            {loading ? "Updating..." : "Reset & Back to Login"}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
