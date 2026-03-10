
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/features/dashboard/Dashboard";
import { Tests } from "@/components/features/tests/Tests";
import { Lectures } from "@/components/features/lectures/Lectures";
import { Results } from "@/components/features/results/Results";
import { Chat } from "@/components/features/chat/Chat";
import { Leaderboard } from "@/components/features/leaderboard/Leaderboard";
import { Profile } from "@/components/features/profile/Profile";
import { Forum } from "@/components/features/forum/Forum";
import { LiveClasses } from "@/components/features/live-classes/LiveClasses";
import { Courses } from "@/components/features/courses/Courses";
import { Notes } from "@/components/features/notes/Notes";
import { Announcements } from "@/components/features/announcements/Announcements";
import { SelectedStudents } from "@/components/features/selected-students/SelectedStudents";
import { Notifications } from "@/components/features/notifications/Notifications";
import { Fees } from "@/components/features/fees/Fees";
import { AttendanceView } from "@/components/features/attendance/AttendanceView";

type ActiveTab = 'dashboard' | 'tests' | 'lectures' | 'results' | 'chat' | 'leaderboard' | 'profile' | 'forum' | 'live-classes' | 'courses' | 'batches' | 'notes' | 'announcements' | 'selected-students' | 'notifications' | 'fees' | 'attendance';

export const StudentPortal = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ActiveTab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tests':
        return <Tests />;
      case 'lectures':
        return <Lectures />;
      case 'results':
        return <Results />;
      case 'chat':
        return <Chat />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'profile':
        return <Profile />;
      case 'forum':
        return <Forum />;
      case 'live-classes':
        return <LiveClasses />;
      case 'courses':
        return <Courses />;
      case 'batches':
        return <div className="p-6"><h1 className="text-3xl font-bold">My Batches</h1><p>Your enrolled batches will be displayed here.</p></div>;
      case 'notes':
        return <Notes />;
      case 'announcements':
        return <Announcements />;
      case 'selected-students':
        return <SelectedStudents />;
      case 'notifications':
        return <Notifications />;
      case 'fees':
        return <Fees />;
      case 'attendance':
        return <AttendanceView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onProfileClick={() => setActiveTab('profile')}
        />
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
