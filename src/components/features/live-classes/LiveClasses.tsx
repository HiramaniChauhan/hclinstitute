import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Video, Calendar, Clock, Play, AlertCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export const LiveClasses = () => {
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Collapsible states
  const [showStreamed, setShowStreamed] = useState(true);
  const [showSaved, setShowSaved] = useState(true);

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const fetchLiveClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/videos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLiveClasses(data);
      }
    } catch (error) {
      console.error("Error fetching live classes:", error);
      toast.error("Failed to load live classes");
    } finally {
      setLoading(false);
    }
  };

  const activeClasses = useMemo(() => {
    return liveClasses.filter(c => c.type === 'live' && (c.status === 'Scheduled' || c.status === 'Live') &&
      ((c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase())));
  }, [liveClasses, searchQuery]);

  const streamedVideos = useMemo(() => {
    return liveClasses.filter(c => c.type === 'live' && c.status === 'Published' &&
      ((c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase())));
  }, [liveClasses, searchQuery]);

  const savedVideos = useMemo(() => {
    return liveClasses.filter(c => c.type === 'youtube' &&
      ((c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase())));
  }, [liveClasses, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Live Classes</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>Live sessions and video library</span>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search classes & videos..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Upcoming & Live Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Upcoming & Active Live Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center p-4">Loading classes...</p>
            ) : activeClasses.length === 0 ? (
              <p className="text-center p-4 text-gray-500">No upcoming classes scheduled.</p>
            ) : (
              activeClasses.map((liveClass) => (
                <div key={liveClass.id} className={`p-4 border rounded-lg ${liveClass.status === 'Live' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{liveClass.title}</h3>
                        {liveClass.status === 'Live' && (
                          <Badge variant="destructive" className="animate-pulse">
                            <AlertCircle size={12} className="mr-1" />
                            Live Now
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{liveClass.date} at {liveClass.time}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Badge variant="outline">{liveClass.subject}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      {liveClass.status === 'Live' ? (
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => window.open(liveClass.url, '_blank')}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Join Now
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          <Calendar className="w-4 h-4 mr-2" />
                          Scheduled
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Streamed Videos (Past Live Classes) */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 flex flex-row items-center justify-between"
          onClick={() => setShowStreamed(!showStreamed)}
        >
          <CardTitle className="flex items-center text-purple-700">
            <Video className="w-5 h-5 mr-2" />
            Streamed Videos
          </CardTitle>
          {showStreamed ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </CardHeader>
        {showStreamed && (
          <CardContent>
            {streamedVideos.length === 0 ? (
              <p className="text-center p-4 text-gray-500">No streamed video recordings available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamedVideos.map((streamedClass) => (
                  <div key={streamedClass.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50 border-l-4 border-l-purple-500">
                    <h3 className="font-semibold text-lg mb-2">{streamedClass.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Streamed on: {streamedClass.date || 'Past'} at {streamedClass.time || ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="outline">{streamedClass.subject}</Badge>
                      <Button size="sm" variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50" onClick={() => window.open(streamedClass.url, '_blank')}>
                        <Play size={14} className="mr-1" />
                        Watch Recording
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Saved Videos (YouTube Integrations) */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 flex flex-row items-center justify-between"
          onClick={() => setShowSaved(!showSaved)}
        >
          <CardTitle className="flex items-center text-red-600">
            <Play className="w-5 h-5 mr-2" />
            Saved Videos
          </CardTitle>
          {showSaved ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </CardHeader>
        {showSaved && (
          <CardContent>
            {savedVideos.length === 0 ? (
              <p className="text-center p-4 text-gray-500">No saved videos available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVideos.map((savedVideo) => (
                  <div key={savedVideo.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50 border-l-4 border-l-red-500">
                    <h3 className="font-semibold text-lg mb-2">{savedVideo.title}</h3>
                    {savedVideo.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{savedVideo.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="outline">{savedVideo.subject}</Badge>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => window.open(savedVideo.url, '_blank')}>
                        <Play size={14} className="mr-1" />
                        Watch Video
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
