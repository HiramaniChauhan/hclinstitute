
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AdminRegisterForm } from "@/components/auth/AdminRegisterForm";
import { StudentPortal } from "@/components/StudentPortal";
import { HomePage } from "@/components/home/HomePage";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type AuthView = 'none' | 'student-login' | 'student-register' | 'admin-login' | 'admin-register';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('none');
  const navigate = useNavigate();

  const onBack = () => setAuthView('none');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  if (user?.role === 'admin') {
    return null; // Render nothing while redirecting
  }

  if (!isAuthenticated && authView === 'none') {
    return (
      <HomePage
        onLogin={() => setAuthView('student-login')}
        onRegister={() => setAuthView('student-register')}
        onAdminLogin={() => setAuthView('admin-login')}
      />
    );
  }

  if (!isAuthenticated && authView === 'student-login') {
    return (
      <LoginForm
        onBack={onBack}
        onRegisterClick={() => setAuthView('student-register')}
      />
    );
  }

  if (!isAuthenticated && authView === 'student-register') {
    return (
      <RegisterForm
        onBack={onBack}
        onSuccess={() => {
          setAuthView('student-login');
        }}
        onLoginClick={() => setAuthView('student-login')}
      />
    );
  }

  if (!isAuthenticated && authView === 'admin-login') {
    return (
      <AdminLoginForm
        onBack={onBack}
        onRegisterClick={() => setAuthView('admin-register')}
      />
    );
  }

  if (!isAuthenticated && authView === 'admin-register') {
    return (
      <AdminRegisterForm
        onBack={onBack}
        onSuccess={() => setAuthView('admin-login')}
        onLoginClick={() => setAuthView('admin-login')}
      />
    );
  }

  return <StudentPortal />;
};

export default Index;
