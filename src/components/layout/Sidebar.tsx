import { useState, useEffect, useCallback } from "react";
import { fetchUnreadChatCount, fetchAboutInfo, fetchMyAnnouncements } from "@/api/portalApi";
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
  Megaphone,
  StickyNote,
  Star
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
  { id: 'give-review', label: 'Give Review', icon: Star },
  { id: 'selected-students', label: 'Selected Students', icon: Trophy },
  { id: 'chat', label: 'Support Chat', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [aboutConfig, setAboutConfig] = useState<any>({
    instituteName: "HCL Institute",
    instituteLogo: ""
  });

  const fetchNotificationCounts = useCallback(() => {
    fetchUnreadChatCount()
      .then(data => setUnreadCount(data.count))
      .catch(err => console.error("Sidebar Unread Error:", err));

    fetchMyAnnouncements()
      .then(announcements => {
        const unread = announcements.filter((a: any) => a.isUnread).length;
        setUnreadAnnouncementsCount(unread);
      })
      .catch(err => console.error("Sidebar Announcements Error:", err));
  }, []);

  useEffect(() => {
    fetchAboutInfo()
      .then(data => {
        if (data) {
          setAboutConfig((prev: any) => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Sidebar About Error:", err));

    fetchNotificationCounts();

    const interval = setInterval(() => {
      fetchNotificationCounts();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchNotificationCounts]);

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-[#1e1e1e] text-white/70 border-r border-white/8 transition-all duration-300 z-40 overflow-hidden shadow-[4px_0_40px_rgba(0,0,0,0.25)]",
      isOpen ? "w-64 translate-x-0" : "w-64 md:w-16 -translate-x-full md:translate-x-0"
    )}>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {aboutConfig.instituteLogo ? (
                <img src={aboutConfig.instituteLogo} alt={`${aboutConfig.instituteName} Logo`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#c17f24] flex items-center justify-center text-white font-bold text-xs shadow-[0_4px_16px_rgba(193,127,36,0.4)] flex-shrink-0" style={{fontFamily: "'Fraunces', serif"}}>
                  {aboutConfig.instituteName?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <h1 className="text-[15px] font-semibold text-white leading-tight break-words" style={{fontFamily: "'Fraunces', serif"}}>{aboutConfig.instituteName}</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-white/60 hover:text-white hover:bg-white/10"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 rounded-xl border border-transparent transition-all duration-200",
                !isOpen && "justify-center px-2",
                activeTab === item.id ? "bg-white/15 text-white font-semibold border-white/15 hover:bg-white/20" : "text-white/65 hover:text-white hover:bg-white/10 hover:border-white/8"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <div className="relative">
                <Icon size={20} />
                {((item.id === 'chat' && unreadCount > 0) || (item.id === 'announcements' && unreadAnnouncementsCount > 0)) && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-[#c17f24] rounded-full border-2 border-[#1e1e1e] shadow-[0_0_6px_rgba(193,127,36,0.6)]"></span>
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
