import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';
import { Fingerprint, FileText, Chrome, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

interface RegisterFormProps {
  onBack: () => void;
  onSuccess: () => void;
  onLoginClick?: () => void;
}

export const RegisterForm = ({ onBack, onSuccess, onLoginClick }: RegisterFormProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { register, sendOtp, verifyOtp, googleLogin } = useAuth();

  // Step 1
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Step 2 
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    qualification: '',
    institute: '',
    fatherName: '',
    motherName: '',
    parentPhone: '',
    emergencyContact: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    aadharNumber: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerified, setIsVerified] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const success = await sendOtp(email);
    setLoading(false);
    if (success) {
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Please check your email/console." });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    const success = await verifyOtp(email, otp);
    setLoading(false);
    if (success) {
      setIsEmailVerified(true);
      setStep(2);
      toast({ title: "Email Verified", description: "You can now complete registration." });
    } else {
      toast({ title: "Verification Failed", description: "Invalid OTP", variant: "destructive" });
    }
  };

  const onGoogleSignupSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    try {
      const googleUser = await googleLogin(credentialResponse.credential, 'student', undefined, true);
      if (googleUser) {
        // Pre-fill form data
        const names = googleUser.name.split(' ');
        setEmail(googleUser.email);
        setFormData(prev => ({
          ...prev,
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || ''
        }));
        setIsEmailVerified(true);
        setStep(2);
        toast({ title: "Google Authenticated", description: "Please complete your profile details." });
      }
    } catch (error) {
      console.error('Google signup error:', error);
      toast({ title: "Google Sign-up Failed", description: "Google authentication failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignupError = () => {
    toast({ title: "Google Sign-up Failed", description: "Google authentication failed", variant: "destructive" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file && field === 'tenthResult') {
      const fileName = file.name.toLowerCase();
      const fullName = `${formData.firstName} ${formData.lastName}`.toLowerCase().trim();
      if (fullName && fileName.includes(fullName.split(' ')[0])) {
        setIsVerified(true);
        toast({ title: "Verified", description: "Name matched with the document!" });
      } else {
        setIsVerified(false);
        toast({ title: "Manual Verification", description: "Name doesn't match the file exactly." });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!formData.agreeTerms) {
      toast({ title: "Error", description: "Please agree to terms and conditions", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        email,
        name: `${formData.firstName} ${formData.lastName}`,
        isVerified,
        tenthResultName: isVerified ? `${formData.firstName} ${formData.lastName}` : null
      };

      const result = await register(payload, 'student');

      if (result) {
        onSuccess();
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative">
        <Button variant="ghost" className="absolute top-4 left-4 flex items-center gap-2" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" /> Back Home
        </Button>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Student Registration</CardTitle>
            <CardDescription>Step 1: Verify your email address</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpSent}
                  />
                </div>
                {otpSent ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter OTP *</label>
                    <Input
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <Button className="w-full mt-4" type="submit" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Verification OTP'}
                  </Button>
                )}
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or continue with</span></div>
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={onGoogleSignupSuccess}
                  onError={onGoogleSignupError}
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>

              <div className="mt-6 text-center text-sm space-y-2">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button type="button" onClick={onLoginClick || onBack} className="text-primary font-semibold hover:underline">
                    Login
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2 Return Block
  return (
    <div className="min-h-screen py-10 px-4 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
      <Button variant="ghost" className="absolute top-4 left-4 flex items-center gap-2" onClick={() => setStep(1)}>
        <ArrowLeft className="w-5 h-5" /> Back to Email
      </Button>
      <Card className="w-full max-w-2xl mt-8">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            Student Registration
          </CardTitle>
          <CardDescription>Step 2: Join HCL Institute - Multi-step Verification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name *</label>
                <Input value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><Fingerprint className="w-4 h-4" /> Aadhar Number *</label>
                <Input
                  placeholder="12-digit Aadhar"
                  value={formData.aadharNumber}
                  onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender *</label>
                <Select value={formData.gender} onValueChange={(v) => handleInputChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> 10th Marksheet *</label>
              <Input
                type="file"
                onChange={(e) => handleFileChange(e, 'tenthResult')}
                required
              />
              <p className="text-xs text-gray-500 mt-1">First Name must match the document name exactly for auto-verification.</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border flex items-center justify-between">
              <span className="text-sm font-medium">Student Verification Status:</span>
              {isVerified ? (
                <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">Verified</span>
              ) : (
                <span className="text-gray-400 font-medium italic">Pending (Manual)</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Password *</label>
                <div className="relative">
                  <Input
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
                <label className="text-sm font-medium">Confirm Password *</label>
                <div className="relative">
                  <Input
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
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" checked={formData.agreeTerms} onCheckedChange={(checked) => handleInputChange('agreeTerms', !!checked)} />
              <label htmlFor="terms" className="text-sm">Agree to HCL terms and conditions</label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
