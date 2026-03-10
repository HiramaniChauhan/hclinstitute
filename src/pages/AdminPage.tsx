
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { AdminPortal } from "@/components/AdminPortal";

const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm forcedRole="admin" />;
  }

  if (user?.role !== 'admin') {
    // Redirect non-admin users to student portal
    window.location.href = '/';
    return null;
  }

  return <AdminPortal />;
};

export default AdminPage;


// import React from "react";
// import { useAuth } from "@/components/auth/AuthProvider";
// import { LoginForm } from "@/components/auth/LoginForm";
// import { AdminPortal } from "@/components/AdminPortal";

// const AdminPage: React.FC = () => {
//   const { user, isAuthenticated } = useAuth();

//   // If not logged in OR role is not admin → show ONLY Admin Login form
//   if (!isAuthenticated || user?.role !== "admin") {
//     return <LoginForm initialTab="admin" />;
//   }

//   // If logged in as admin → show Admin Dashboard
//   return <AdminPortal />;
// };

// export default AdminPage;
