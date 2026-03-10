
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
  { id: 'batches', label: 'My Batches', icon: Users },
  { id: 'live-classes', label: 'Live Classes', icon: Video },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'selected-students', label: 'Selected Students', icon: Trophy },
  { id: 'chat', label: 'Support Chat', icon: MessageCircle },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'forum', label: 'Forum', icon: MessageSquare },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) => {
  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40",
      isOpen ? "w-64" : "w-16"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-2">
              <img src="/placeholder.svg" alt="HCL Institute Logo" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-blue-600">HCL Institute</h1>
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
          <p className="text-xs text-gray-500 mt-1">Founded by Hiramani Chauhan</p>
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
                !isOpen && "justify-center px-2"
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
