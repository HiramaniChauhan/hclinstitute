import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';
import { ArrowLeft, KeySquare, Eye, EyeOff, Chrome } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

interface AdminRegisterFormProps {
    onBack: () => void;
    onSuccess: () => void;
    onLoginClick: () => void;
}

export const AdminRegisterForm = ({ onBack, onSuccess, onLoginClick }: AdminRegisterFormProps) => {
    const [step, setStep] = useState(1);
    const [authMethod, setAuthMethod] = useState<'local' | 'google'>('local');
    const [mockGoogleEmail, setMockGoogleEmail] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: '',
        adminCode: ''
    });

    // States for Reset Secret Key flow
    const [isResetMode, setIsResetMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [resetOtp, setResetOtp] = useState('');
    const [newSecret, setNewSecret] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showAdminSecret, setShowAdminSecret] = useState(false);
    const [showNewSecret, setShowNewSecret] = useState(false);

    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { register, googleLogin, sendAdminSecretOtp, updateAdminSecret, sendOtp, verifyOtp } = useAuth();

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStep1Local = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }

        setLoading(true);
        const success = await sendOtp(formData.email);
        setLoading(false);
        if (success) {
            toast({ title: "OTP Sent", description: "Please check your email for the verification code." });
            setAuthMethod('local');
            setStep(2);
        }
    };

    const handleStep2OtpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const isValid = await verifyOtp(formData.email, formData.otp);
        setLoading(false);
        if (isValid) {
            toast({ title: "Email Verified", description: "Your email has been verified successfully." });
            setStep(3);
        } else {
            toast({ title: "Error", description: "Invalid OTP. Please try again.", variant: "destructive" });
        }
    };

    const onGoogleSignupSuccess = async (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        setLoading(true);
        try {
            const googleUser = await googleLogin(credentialResponse.credential, 'admin', undefined, true);
            if (googleUser) {
                const names = googleUser.name.split(' ');
                setFormData(prev => ({
                    ...prev,
                    email: googleUser.email,
                    firstName: names[0] || '',
                    lastName: names.slice(1).join(' ') || '',
                }));
                setMockGoogleEmail(googleUser.email);
                (window as any).googleCredential = credentialResponse.credential;
                setAuthMethod('google');
                setStep(3); // Advance to Secret Key
                toast({ title: "Google Authenticated", description: "Please provide the Admin Secret Code to complete setup." });
            }
        } catch (error) {
            console.error('Admin Google signup error:', error);
            toast({ title: "Google Auth Failed", description: "Authentication failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const onGoogleSignupError = () => {
        toast({ title: "Google Auth Failed", description: "Authentication failed", variant: "destructive" });
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.adminCode.trim()) {
            toast({ title: "Error", description: "Admin Secret Code is required", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            if (authMethod === 'local') {
                const { ...rest } = formData;
                await register({
                    email: rest.email,
                    password: rest.password,
                    name: `${rest.firstName} ${rest.lastName}`,
                    adminSecret: rest.adminCode,
                    otp: rest.otp
                }, 'admin');
                toast({ title: "Success", description: "Admin registration request submitted." });
                onSuccess();
            } else {
                const credential = (window as any).googleCredential;
                const success = await googleLogin(credential, 'admin', formData.adminCode);
                if (success) {
                    toast({ title: "Google Admin Signup Successful" });
                    delete (window as any).googleCredential;
                    onSuccess();
                }
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast({ title: "Error", description: "Registration failed. Please try again.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSecretOtp = async () => {
        setLoading(true);
        const success = await sendAdminSecretOtp('hiramanichauhan2399@gmail.com');
        setLoading(false);
        if (success) {
            setOtpSent(true);
            toast({ title: "OTP Sent", description: "Sent to the master admin email." });
        }
    };

    const handleUpdateSecret = async () => {
        setLoading(true);
        const success = await updateAdminSecret('hiramanichauhan2399@gmail.com', resetOtp, newSecret);
        setLoading(false);
        if (success) {
            setIsResetMode(false);
            setOtpSent(false);
            setResetOtp('');
            setNewSecret('');
        }
    };

    if (isResetMode) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4 relative">
                <Button variant="ghost" className="absolute top-4 left-4 flex items-center gap-2" onClick={() => setIsResetMode(false)}>
                    <ArrowLeft className="w-5 h-5" /> Back to Setup
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
                                    An OTP will be sent to the master administrator email address (hiramanichauhan2399@gmail.com).
                                </p>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={handleRequestSecretOtp} disabled={loading}>
                                    {loading ? 'Sending...' : 'Request OTP'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">OTP Code</label>
                                    <Input placeholder="6-digit code" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} />
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

    const renderStepContent = () => {
        if (step === 1) {
            return (
                <div className="space-y-6">
                    <form onSubmit={handleStep1Local} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-medium">First Name *</label>
                                <Input id="firstName" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium">Last Name *</label>
                                <Input id="lastName" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email *</label>
                            <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">Password *</label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
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
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </Button>
                    </form>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={onGoogleSignupSuccess}
                            onError={onGoogleSignupError}
                            theme="outline"
                            size="large"
                            width="100%"
                        />
                    </div>

                    <div className="text-center mt-4 text-sm">
                        Already have an account?{" "}
                        <button type="button" onClick={onLoginClick} className="text-purple-600 hover:underline">
                            Login here
                        </button>
                    </div>
                </div>
            );
        }

        if (step === 2) {
            return (
                <form onSubmit={handleStep2OtpVerify} className="space-y-6">
                    <div className="text-center text-sm text-gray-600 mb-4">
                        We sent a verification code to <span className="font-semibold">{formData.email}</span>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="otp" className="text-sm font-medium">Verification Code *</label>
                        <Input
                            id="otp"
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            className="text-center tracking-widest text-lg"
                            value={formData.otp}
                            onChange={(e) => handleInputChange('otp', e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </Button>
                </form>
            );
        }

        if (step === 3) {
            return (
                <div className="space-y-6">
                    <form onSubmit={handleFinalSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="adminCode" className="text-sm font-medium">Admin Secret Code *</label>
                            <div className="relative">
                                <Input
                                    id="adminCode"
                                    type={showAdminSecret ? "text" : "password"}
                                    placeholder="Enter master secret code to verify implementation authority"
                                    value={formData.adminCode}
                                    onChange={(e) => handleInputChange('adminCode', e.target.value)}
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
                            {loading ? 'Authenticating...' : 'Complete Registration'}
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
            );
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4 relative">
            <Button variant="ghost" className="absolute top-4 left-4 flex items-center gap-2" onClick={step > 1 ? () => setStep(step - 1) : onBack}>
                <ArrowLeft className="w-5 h-5" /> {step > 1 ? 'Back' : 'Back Home'}
            </Button>

            <Card className="w-full max-w-md mt-12 shadow-xl border-purple-200">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Admin Registration
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && 'Create an administrator account'}
                        {step === 2 && 'Verify your email address'}
                        {step === 3 && 'Verify Administrative Authority'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderStepContent()}
                </CardContent>
            </Card>
        </div>
    );
};
