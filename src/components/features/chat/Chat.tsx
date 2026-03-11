
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Search, MessageCircle, User, Shield, Paperclip, Mic, Image, Video, FileText, Pencil, Trash2, X, Check, CheckCheck, Download, Play, Music } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const Chat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [editValue, setEditValue] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ file: File, base64: string, type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (studentId: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/chat/messages/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMessages(data);

      // If there are unread messages sent TO us, mark them as read
      const unreadFromOther = data.filter((m: any) => m.sender !== user?.role && !m.read);
      if (unreadFromOther.length > 0) {
        markAsRead(studentId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async (studentId: string) => {
    try {
      await fetch(`/api/chat/read/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    console.log("[Chat] Auth User state changed:", user);
    if (!user) {
      console.warn("[Chat] No user found in context");
      return;
    }

    if (user.role === 'admin') {
      console.log("[Chat] Admin detected, fetching conversations...");
      fetchConversations();
    } else if (user.role === 'student') {
      console.log("[Chat] Student detected, setting selectedChat to:", user.id);
      setSelectedChat(user.id);
      fetchMessages(user.id);
    }
  }, [user]);

  // Polling for real-time updates
  useEffect(() => {
    if (!selectedChat) return;

    console.log("[Chat] Selected chat changed:", selectedChat, "Fetching messages...");
    fetchMessages(selectedChat);
    markAsRead(selectedChat);

    const interval = setInterval(() => {
      fetchMessages(selectedChat, true); // Fetch silently for polling
      if (user?.role === 'admin') { // Keep admin conversation polling
        fetchConversations();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedChat, user]); // Keep user in dependency array for admin conversation polling

  const handleSendMessage = async () => {
    if ((!message.trim() && !pendingAttachment) || !selectedChat) return;

    try {
      const body = {
        studentId: selectedChat,
        text: message || (pendingAttachment ? `Sent a ${pendingAttachment.type}` : ""),
        type: pendingAttachment ? pendingAttachment.type : 'text',
        attachmentUrl: pendingAttachment ? pendingAttachment.base64 : null
      };

      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages([...messages, newMessage]);
        setMessage("");
        setPendingAttachment(null);
        if (user?.role === 'admin') fetchConversations();
      }
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleEditMessage = async (msgId: string) => {
    try {
      const response = await fetch(`/api/chat/${msgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: editValue })
      });

      if (response.ok) {
        const updated = await response.json();
        setMessages(messages.map(m => m.id === msgId ? updated : m));
        setEditingMessage(null);
        toast.success("Message updated");
      }
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Are you sure you want to delete this message for everyone?")) return;
    try {
      const response = await fetch(`/api/chat/${msgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMessages(messages.filter(m => m.id !== msgId));
        toast.success("Message deleted");
      }
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleFileClick = (type: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-type', type);
      const accept = type === 'image' ? 'image/*' :
        type === 'video' ? 'video/*' :
          type === 'voice' ? 'audio/*' :
            '.pdf';
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = e.target.getAttribute('data-type') || 'file';
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingAttachment({
          file,
          base64: reader.result as string,
          type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderMessageContent = (msg: any) => {
    if (msg.type === 'text' || !msg.attachmentUrl) {
      return <p className="text-sm">{msg.text}</p>;
    }

    switch (msg.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img src={msg.attachmentUrl} alt="Attachment" className="max-w-full rounded-md shadow-sm border" />
            {msg.text && <p className="text-sm">{msg.text}</p>}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            <video controls className="max-w-full rounded-md">
              <source src={msg.attachmentUrl} />
              Your browser does not support the video tag.
            </video>
            {msg.text && <p className="text-sm">{msg.text}</p>}
          </div>
        );
      case 'voice':
        return (
          <div className="space-y-2">
            <audio controls className="max-w-full h-10 overflow-hidden rounded-full brightness-90">
              <source src={msg.attachmentUrl} />
            </audio>
            {msg.text && <p className="text-sm">{msg.text}</p>}
          </div>
        );
      case 'pdf':
        return (
          <div className="space-y-2">
            <a
              href={msg.attachmentUrl}
              download={`document_${msg.id}.pdf`}
              className="flex items-center gap-2 p-3 bg-white/10 rounded-md hover:bg-white/20 transition-colors border border-white/20"
            >
              <FileText size={24} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Document (PDF)</p>
                <p className="text-[10px] opacity-70">Click to preview/download</p>
              </div>
              <Download size={18} />
            </a>
            {msg.text && <p className="text-sm">{msg.text}</p>}
          </div>
        );
      default:
        return <p className="text-sm">{msg.text}</p>;
    }
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Chat List (Admin Only) */}
      {user?.role === 'admin' && (
        <Card className="w-1/3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Student Chats
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input placeholder="Search students..." className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[calc(100%-80px)]">
            <div className="space-y-1">
              {conversations.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-b transition-colors ${selectedChat === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  onClick={() => setSelectedChat(chat.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100">
                        <User size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{chat.name}</p>
                        <span className="text-xs text-gray-500">{new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className={`${user?.role === 'admin' ? 'flex-1' : 'w-full'}`}>
        {selectedChat || user?.role === 'student' ? (
          <div className="flex flex-col h-full">
            <CardHeader className="border-b shrink-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100">
                    {user?.role === 'admin' ? <User size={16} /> : <Shield size={16} />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {user?.role === 'admin' ? conversations.find(c => c.id === selectedChat)?.name : "Institute Support"}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'admin' ? "Student" : "Active"}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const showDate = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

                return (
                  <div key={msg.id} className="space-y-4">
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <Badge variant="outline" className="bg-white/50 text-gray-500 font-normal px-4">
                          {formatDateSeparator(msg.timestamp)}
                        </Badge>
                      </div>
                    )}
                    <div
                      className={`flex ${msg.sender === user?.role ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="group relative max-w-[85%] lg:max-w-[70%]">
                        {user?.role === 'admin' && (
                          <div className={`absolute -top-6 ${msg.sender === 'admin' ? '-right-2' : '-left-2'} hidden group-hover:flex gap-1 bg-white shadow-md rounded-md p-1 border z-10`}>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingMessage(msg.id); setEditValue(msg.text); }}>
                              <Pencil size={12} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleDeleteMessage(msg.id)}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        )}

                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${msg.sender === user?.role
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                          }`}>
                          {editingMessage === msg.id ? (
                            <div className="flex items-center gap-2 min-w-[200px]">
                              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} size={5} className="h-7 text-sm text-black" />
                              <Button size="icon" className="h-7 w-7 bg-green-500" onClick={() => handleEditMessage(msg.id)}>
                                <Check size={14} />
                              </Button>
                              <Button size="icon" className="h-7 w-7 bg-red-500" onClick={() => setEditingMessage(null)}>
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            renderMessageContent(msg)
                          )}

                          <div className="flex items-center justify-between gap-4 mt-2">
                            <span className={`text-[10px] ${msg.sender === user?.role ? 'text-blue-100' : 'text-gray-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.edited && " (edited)"}
                            </span>
                            {msg.sender === user?.role && (
                              <div className="flex">
                                {msg.read ? (
                                  <CheckCheck size={14} className="text-blue-300" />
                                ) : (
                                  <Check size={14} className="text-gray-300" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4 shrink-0 bg-white rounded-b-xl">
              {pendingAttachment && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 text-white rounded">
                      {pendingAttachment.type === 'image' && <Image size={18} />}
                      {pendingAttachment.type === 'video' && <Video size={18} />}
                      {pendingAttachment.type === 'voice' && <Mic size={18} />}
                      {pendingAttachment.type === 'pdf' && <FileText size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pendingAttachment.file.name}</p>
                      <p className="text-xs opacity-70 capitalize">{pendingAttachment.type} ready to send</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setPendingAttachment(null)}>
                    <X size={18} />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-500 transition-colors" onClick={() => handleFileClick('image')}>
                    <Image size={20} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-500 transition-colors" onClick={() => handleFileClick('voice')}>
                    <Mic size={20} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-500 transition-colors" onClick={() => handleFileClick('video')}>
                    <Video size={20} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-500 transition-colors" onClick={() => handleFileClick('pdf')}>
                    <FileText size={20} />
                  </Button>
                </div>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={user?.role === 'admin' ? "Reply to student..." : "Ask your question..."}
                  className="bg-gray-50"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                {user?.role === 'admin' ? "Respond securely to student requests." : "One shared support line for all admins. Messages are saved securely."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle size={72} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a student from the sidebar to start responding.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
