import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Header } from "@/components/layout/Header";
import { AdminDashboard } from "@/components/features/admin/dashboard/AdminDashboard";
import { TestCreation } from "@/components/features/admin/test-creation/TestCreation";
import { VideoManagement } from "@/components/features/admin/video-management/VideoManagement";
import { PerformanceTracker } from "@/components/features/admin/performance-tracker/PerformanceTracker";
import { Analytics } from "@/components/features/admin/analytics/Analytics";
import { RealTimeMonitoring } from "@/components/features/admin/real-time-monitoring/RealTimeMonitoring";
import { CourseManagement } from "@/components/features/admin/course-management/CourseManagement";
import { BatchManagement } from "@/components/features/admin/batch-management/BatchManagement";
import { Chat } from "@/components/features/chat/Chat";
import { LectureManagement } from "@/components/features/admin/lecture-management/LectureManagement";
import { NotesManagement } from "@/components/features/admin/notes-management/NotesManagement";
import { AnnouncementsManagement } from "@/components/features/admin/announcements-management/AnnouncementsManagement";
import { SelectedStudentsManagement } from "@/components/features/admin/selected-students-management/SelectedStudentsManagement";
import { AboutManagement } from "@/components/features/admin/about-management/AboutManagement";
import { AdminProfile } from "@/components/features/admin/profile/AdminProfile";
import { StudentManagement } from "@/components/features/admin/student-management/StudentManagement";
// import { FeesManagement } from "@/components/features/admin/fees-management/FeesManagement";

type AdminActiveTab = 'dashboard' | 'profile' | 'test-creation' | 'video-management' | 'performance-tracker' | 'analytics' | 'real-time-monitoring' | 'course-management' | 'batch-management' | 'chat' | 'lecture-management' | 'notes-management' | 'announcements' | 'selected-students' | 'student-management' | 'about-management' | 'fees-management';

export const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState<AdminActiveTab>(() => {
    const hash = window.location.hash.replace('#', '');
    return (hash as AdminActiveTab) || 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveTab((hash as AdminActiveTab) || 'dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as AdminActiveTab);
    window.location.hash = tab;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'profile':
        return <AdminProfile />;
      case 'student-management':
        return <StudentManagement />;
      case 'test-creation':
        return <TestCreation />;
      case 'video-management':
        return <VideoManagement />;
      case 'performance-tracker':
        return <PerformanceTracker />;
      case 'analytics':
        return <Analytics />;
      case 'real-time-monitoring':
        return <RealTimeMonitoring />;
      case 'course-management':
        return <CourseManagement />;
      case 'batch-management':
        return <BatchManagement />;
      case 'chat':
        return <Chat />;
      case 'lecture-management':
        return <LectureManagement />;
      case 'notes-management':
        return <NotesManagement />;
      case 'announcements':
        return <AnnouncementsManagement />;
      case 'selected-students':
        return <SelectedStudentsManagement />;
      case 'about-management':
        return <AboutManagement />;
      case 'fees-management':
        return <div>Fees management not available</div>;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={() => handleTabChange('profile')}
        />
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
