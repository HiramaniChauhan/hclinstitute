
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
  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 overflow-y-auto",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-2">
              <img src="/placeholder.svg" alt="HCL Institute Logo" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-red-600">HCL Admin</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
        {isOpen && (
          <p className="text-xs text-gray-500 mt-1">Director: Hiramani Chauhan</p>
        )}
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
                activeTab !== item.id && "text-gray-600 hover:text-gray-900"
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} />
              {isOpen && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    </div>
  );
};
