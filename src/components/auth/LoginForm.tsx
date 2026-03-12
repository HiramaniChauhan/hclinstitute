import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthProvider';
import { LogIn, Chrome, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onRegisterClick: () => void;
  onBack: () => void;
}
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { GoogleLogin } from '@react-oauth/google';

export const LoginForm = ({ onRegisterClick, onBack }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const { toast } = useToast();
  const { login, googleLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Validation Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const success = await login({ email, password }, 'student');
      if (success) {
        toast({ title: "Login Successful", description: "Welcome back!" });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    try {
      const success = await googleLogin(credentialResponse.credential, 'student');
      if (success) {
        toast({ title: "Login Successful", description: "Signed in with Google" });
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({ title: "Login Failed", description: "Google authentication failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onGoogleError = () => {
    toast({ title: "Login Failed", description: "Google authentication failed", variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 flex items-center gap-2"
        onClick={onBack}
      >
        <ArrowLeft className="w-5 h-5" /> Back Home
      </Button>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <LogIn className="w-6 h-6" /> Student Login
          </CardTitle>
          <CardDescription>Login to access your student portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="name@example.com"
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
              <p className="text-[10px] text-gray-500 mt-1">enter atleast 6 charector</p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login as Student'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-sm text-gray-500 hover:text-primary hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          </form>

          <ForgotPasswordModal
            isOpen={isForgotModalOpen}
            onClose={() => setIsForgotModalOpen(false)}
            role="student"
          />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onRegisterClick}
                className="text-primary font-semibold hover:underline"
              >
                Register Now
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
