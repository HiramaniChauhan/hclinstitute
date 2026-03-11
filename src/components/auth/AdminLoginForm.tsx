import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';
import { ShieldCheck, ArrowLeft, KeySquare, Eye, EyeOff, Lock, Chrome } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { GoogleLogin } from '@react-oauth/google';

interface AdminLoginFormProps {
    onRegisterClick: () => void;
    onBack: () => void;
}

export const AdminLoginForm = ({ onRegisterClick, onBack }: AdminLoginFormProps) => {
    const [step, setStep] = useState(1);
    const [authMethod, setAuthMethod] = useState<'local' | 'google'>('local');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminSecret, setAdminSecret] = useState('');

    // States for Reset Secret Key flow
    const [isResetMode, setIsResetMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newSecret, setNewSecret] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminSecret, setShowAdminSecret] = useState(false);
    const [showNewSecret, setShowNewSecret] = useState(false);
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { login, googleLogin, sendAdminSecretOtp, updateAdminSecret } = useAuth();

    const handleStep1Local = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({ title: "Error", description: "Email and password required", variant: "destructive" });
            return;
        }
        setAuthMethod('local');
        setStep(2);
    };

    const onGoogleLoginSuccess = async (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        setLoading(true);
        try {
            // Store the credential for later use in handleFinalLogin
            // We need to decode it partially to get the email, or just send it to backend to get the email
            // For now, let's just get the user info from the token if possible or fetch it
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential, role: 'admin', isSignup: true }),
            });
            const data = await response.json();
            if (response.ok) {
                setEmail(data.user.email);
                setAuthMethod('google');
                setStep(2);
                // Store the credential to use in final step
                (window as any).googleCredential = credentialResponse.credential;
            } else {
                toast({ title: "Auth Failed", description: data.error, variant: "destructive" });
            }
        } catch (error) {
            console.error('Admin Google login error:', error);
            toast({ title: "Google Auth Failed", description: "Connection error", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const onGoogleLoginError = () => {
        toast({ title: "Google Auth Failed", description: "Authentication failed", variant: "destructive" });
    };

    const handleFinalLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!adminSecret) {
            toast({ title: "Error", description: "Master Admin Secret required.", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            if (authMethod === 'local') {
                const success = await login({ email, password, adminSecret }, 'admin');
                if (success) {
                    // toast is handled in AuthProvider normally, but keeping as original
                }
            } else {
                // Use the stored google credential
                const credential = (window as any).googleCredential;
                const success = await googleLogin(credential, 'admin', adminSecret);
                if (success) {
                    delete (window as any).googleCredential;
                }
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOtp = async () => {
        setLoading(true);
        const success = await sendAdminSecretOtp('hiramanichauhan2399@gmail.com');
        setLoading(false);
        if (success) {
            setOtpSent(true);
            toast({ title: "OTP Sent", description: "Sent to hi...99@gmail.com" });
        }
    };

    const handleUpdateSecret = async () => {
        setLoading(true);
        const success = await updateAdminSecret('hiramanichauhan2399@gmail.com', otp, newSecret);
        setLoading(false);
        if (success) {
            setIsResetMode(false);
            setOtpSent(false);
            setOtp('');
            setNewSecret('');
        }
    };

    if (isResetMode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4 relative">
                <Button variant="ghost" className="absolute top-4 left-4 flex items-center gap-2" onClick={() => setIsResetMode(false)}>
                    <ArrowLeft className="w-5 h-5" /> Back to Login
                </Button>
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                            <KeySquare className="w-6 h-6 text-purple-600" /> Reset Admin Secret
                        </CardTitle>
                        <CardDescription>Update the master admin secret key via OTP</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!otpSent ? (
                            <div className="text-center space-y-4">
                                <p className="text-sm text-gray-600">
                                    An OTP will be sent to the master administrator email address (hi...99@gmail.com).
                                </p>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleRequestOtp} disabled={loading}>
                                    {loading ? 'Sending...' : 'Request OTP'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">OTP Code</label>
                                    <Input
                                        placeholder="6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">New Admin Secret Key</label>
                                    <div className="relative">
                                        <Input
                                            type={showNewSecret ? "text" : "password"}
                                            placeholder="Enter new master secret"
                                            value={newSecret}
                                            onChange={(e) => setNewSecret(e.target.value)}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewSecret(!showNewSecret)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        >
                                            {showNewSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleUpdateSecret} disabled={loading}>
                                    {loading ? 'Updating...' : 'Verify & Update Secret'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4 relative">
            <Button
                variant="ghost"
                className="absolute top-4 left-4 flex items-center gap-2"
                onClick={step === 2 ? () => setStep(1) : onBack}
            >
                <ArrowLeft className="w-5 h-5" /> {step === 2 ? 'Back to Email' : 'Back Home'}
            </Button>

            <Card className="w-full max-w-md border-purple-200 shadow-xl shadow-purple-900/5">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 text-purple-800">
                        <ShieldCheck className="w-6 h-6" /> Admin Portal
                    </CardTitle>
                    <CardDescription>
                        {step === 1 ? 'Step 1: Secure login for staff' : 'Step 2: Verify Administrative Authority'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <div className="space-y-4">
                            <form onSubmit={handleStep1Local} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Admin Email</label>
                                    <Input
                                        type="email"
                                        placeholder="admin@hclins.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                    Continue to Verification
                                </Button>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotModalOpen(true)}
                                        className="text-sm text-gray-500 hover:text-purple-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                                    >
                                        <Lock className="w-3 h-3" /> Forgot Admin Password?
                                    </button>
                                </div>
                            </form>

                            <ForgotPasswordModal
                                isOpen={isForgotModalOpen}
                                onClose={() => setIsForgotModalOpen(false)}
                                role="admin"
                            />

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={onGoogleLoginSuccess}
                                    onError={onGoogleLoginError}
                                    theme="outline"
                                    size="large"
                                    width="100%"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <form onSubmit={handleFinalLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Master Admin Secret</label>
                                    <div className="relative">
                                        <Input
                                            type={showAdminSecret ? "text" : "password"}
                                            placeholder="Enter Secret Key"
                                            value={adminSecret}
                                            onChange={(e) => setAdminSecret(e.target.value)}
                                            required
                                            autoFocus
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAdminSecret(!showAdminSecret)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        >
                                            {showAdminSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                                    {loading ? 'Authenticating...' : 'Secure Login'}
                                </Button>
                            </form>

                            <div className="mt-4 flex flex-col items-center justify-center space-y-2 text-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsResetMode(true)}
                                    className="text-gray-500 hover:text-purple-600 hover:underline"
                                >
                                    Forgot/Edit Master Secret?
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
                {step === 1 && (
                    <CardFooter className="flex justify-center border-t py-4 bg-gray-50/50">
                        <p className="text-gray-600 text-sm">
                            New administrator?{' '}
                            <button
                                onClick={onRegisterClick}
                                className="text-purple-600 font-semibold hover:underline"
                            >
                                Register here
                            </button>
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};
