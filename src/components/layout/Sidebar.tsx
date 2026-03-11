import { useState, useEffect } from "react";
import { fetchUnreadChatCount, fetchAboutInfo } from "@/api/portalApi";
import {
  Home,
  FileText,
  Play,
  BarChart3,
  MessageCircle,
  Trophy,
  User,
  MessageSquare,
  Video,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Users,
  StickyNote,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'tests', label: 'Tests', icon: FileText },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'lectures', label: 'Lectures', icon: Play },
  { id: 'live-classes', label: 'Live Classes', icon: Video },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'selected-students', label: 'Selected Students', icon: Trophy },
  { id: 'chat', label: 'Support Chat', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [aboutConfig, setAboutConfig] = useState<any>({
    instituteName: "HCL Institute",
    instituteLogo: ""
  });

  useEffect(() => {
    fetchAboutInfo()
      .then(data => {
        if (data) {
          setAboutConfig((prev: any) => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Sidebar About Error:", err));

    fetchUnreadChatCount()
      .then(data => setUnreadCount(data.count))
      .catch(err => console.error("Sidebar Unread Error:", err));

    const interval = setInterval(() => {
      fetchUnreadChatCount()
        .then(data => setUnreadCount(data.count))
        .catch(err => console.error("Sidebar Unread Error:", err));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-[#24252a] text-gray-300 border-r border-gray-700 transition-all duration-300 z-40",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-2">
              {aboutConfig.instituteLogo ? (
                <img src={aboutConfig.instituteLogo} alt={`${aboutConfig.instituteName} Logo`} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
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
                activeTab === item.id ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-300 hover:text-white hover:bg-white/10"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="relative">
                <Icon size={20} />
                {item.id === 'chat' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
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
