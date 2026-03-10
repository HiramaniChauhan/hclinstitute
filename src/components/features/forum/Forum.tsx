
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, MessageCircle, ThumbsUp, Eye } from "lucide-react";

export const Forum = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Topics", count: 156 },
    { id: "math", name: "Mathematics", count: 45 },
    { id: "physics", name: "Physics", count: 38 },
    { id: "chemistry", name: "Chemistry", count: 29 },
    { id: "general", name: "General", count: 44 }
  ];

  const discussions = [
    {
      id: 1,
      title: "Help with Integration by Parts",
      content: "I'm struggling with this calculus problem. Can someone explain the steps?",
      author: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b882?w=32&h=32&fit=crop&crop=face",
      category: "Mathematics",
      replies: 12,
      likes: 8,
      views: 45,
      timeAgo: "2 hours ago",
      solved: false
    },
    {
      id: 2,
      title: "Thermodynamics - First Law Question",
      content: "Can someone help me understand the relationship between internal energy and heat?",
      author: "Mike Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      category: "Physics",
      replies: 7,
      likes: 15,
      views: 67,
      timeAgo: "4 hours ago",
      solved: true
    },
    {
      id: 3,
      title: "Organic Chemistry Reaction Mechanisms",
      content: "I need help understanding SN1 vs SN2 reactions. What are the key differences?",
      author: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
      category: "Chemistry",
      replies: 9,
      likes: 12,
      views: 34,
      timeAgo: "6 hours ago",
      solved: false
    },
    {
      id: 4,
      title: "Study Schedule Tips",
      content: "How do you manage time between different subjects? Looking for effective strategies.",
      author: "David Kim",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=32&h=32&fit=crop&crop=face",
      category: "General",
      replies: 23,
      likes: 31,
      views: 89,
      timeAgo: "1 day ago",
      solved: false
    }
  ];

  const filteredDiscussions = activeCategory === "all" 
    ? discussions 
    : discussions.filter(d => d.category.toLowerCase() === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discussion Forum</h1>
        <Button>
          <Plus size={16} className="mr-2" />
          New Discussion
        </Button>
      </div>

      {/* Search and Categories */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input placeholder="Search discussions..." className="pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              className="whitespace-nowrap"
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        {filteredDiscussions.map((discussion) => (
          <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={discussion.avatar} />
                  <AvatarFallback>{discussion.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{discussion.title}</h3>
                      {discussion.solved && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Solved
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">{discussion.category}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{discussion.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>by {discussion.author}</span>
                      <span>{discussion.timeAgo}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {discussion.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp size={14} />
                        {discussion.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={14} />
                        {discussion.replies} replies
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Forum Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">156</p>
              <p className="text-sm text-gray-600">Total Discussions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">89</p>
              <p className="text-sm text-gray-600">Solved Problems</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">342</p>
              <p className="text-sm text-gray-600">Active Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">1,247</p>
              <p className="text-sm text-gray-600">Total Replies</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
