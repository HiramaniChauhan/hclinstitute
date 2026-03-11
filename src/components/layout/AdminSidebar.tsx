import { useState, useEffect } from "react";
import { fetchUnreadChatCount, fetchAboutInfo } from "@/api/portalApi";
import {
  LayoutDashboard,
  FileEdit,
  Video,
  BarChart3,
  TrendingUp,
  Monitor,
  BookOpen,
  Users,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  StickyNote,
  Megaphone,
  Trophy,
  Info,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'test-creation', label: 'Test Creation', icon: FileEdit },
  { id: 'course-management', label: 'Course Management', icon: BookOpen },
  { id: 'lecture-management', label: 'Lecture Management', icon: Play },
  { id: 'video-management', label: 'Video Management', icon: Video },
  { id: 'notes-management', label: 'Notes Management', icon: StickyNote },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'student-management', label: 'Student Management', icon: Users },
  { id: 'selected-students', label: 'Selected Students', icon: Trophy },
  { id: 'about-management', label: 'About Management', icon: Info },
  { id: 'chat', label: 'Student Chat', icon: MessageCircle },
];

export const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: AdminSidebarProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [aboutConfig, setAboutConfig] = useState<any>({
    instituteName: "HCL Admin",
    directorName: "Hiramani Chauhan",
    instituteLogo: ""
  });

  useEffect(() => {
    // Fetch about info for logo/name
    fetchAboutInfo()
      .then(data => {
        if (data) {
          setAboutConfig((prev: any) => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Admin Sidebar About Error:", err));

    // Initial fetch
    fetchUnreadChatCount()
      .then(data => setUnreadCount(data.count))
      .catch(err => console.error("Admin Sidebar Unread Error:", err));

    // Poll every 15 seconds
    const interval = setInterval(() => {
      fetchUnreadChatCount()
        .then(data => setUnreadCount(data.count))
        .catch(err => console.error("Admin Sidebar Unread Error:", err));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-[#24252a] text-gray-300 border-r border-gray-700 transition-all duration-300 z-40 overflow-y-auto",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-2">
              {aboutConfig.instituteLogo ? (
                <img src={aboutConfig.instituteLogo} alt={`${aboutConfig.instituteName} Logo`} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                  {aboutConfig.instituteName?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h1 className="text-xl font-bold text-white line-clamp-1">{aboutConfig.instituteName}</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-300 hover:text-white hover:bg-white/10"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                !isOpen && "justify-center px-2",
                activeTab === item.id ? "bg-red-600 text-white hover:bg-red-700" : "text-gray-300 hover:text-white hover:bg-white/10"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="relative">
                <Icon size={20} />
                {item.id === 'chat' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                )}
              </div>
              {isOpen && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    </div>
  );
};
