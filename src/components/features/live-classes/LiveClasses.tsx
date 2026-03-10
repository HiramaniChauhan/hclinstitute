
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Users, Play, AlertCircle } from "lucide-react";

export const LiveClasses = () => {
  const upcomingClasses = [
    {
      id: 1,
      title: "Advanced Mathematics Session",
      subject: "Mathematics",
      instructor: "Dr. Smith",
      date: "Today",
      time: "2:00 PM",
      duration: "2 hours",
      participants: 45,
      status: "starting-soon"
    },
    {
      id: 2,
      title: "Reasoning Workshop",
      subject: "Reasoning", 
      instructor: "Prof. Johnson",
      date: "Tomorrow",
      time: "10:00 AM",
      duration: "1.5 hours",
      participants: 32,
      status: "scheduled"
    }
  ];

  const pastClasses = [
    {
      id: 3,
      title: "Computer Programming Basics",
      subject: "Computer",
      instructor: "Ms. Davis",
      date: "Yesterday",
      time: "3:00 PM",
      duration: "2 hours",
      recordingAvailable: true
    },
    {
      id: 4,
      title: "Mathematics Problem Solving",
      subject: "Mathematics",
      instructor: "Dr. Smith",
      date: "2 days ago",
      time: "11:00 AM", 
      duration: "1 hour",
      recordingAvailable: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Live Classes</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span>Live sessions with instructors</span>
        </div>
      </div>

      {/* Upcoming Live Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Upcoming Live Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingClasses.map((liveClass) => (
              <div key={liveClass.id} className={`p-4 border rounded-lg ${
                liveClass.status === 'starting-soon' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{liveClass.title}</h3>
                      {liveClass.status === 'starting-soon' && (
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertCircle size={12} className="mr-1" />
                          Starting Soon
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{liveClass.date} at {liveClass.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{liveClass.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{liveClass.participants} enrolled</span>
                      </div>
                      <div>
                        <span>Instructor: {liveClass.instructor}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Badge variant="outline">{liveClass.subject}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    {liveClass.status === 'starting-soon' ? (
                      <Button className="bg-red-600 hover:bg-red-700">
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Past Classes with Recordings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Past Classes & Recordings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastClasses.map((pastClass) => (
              <div key={pastClass.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{pastClass.title}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{pastClass.date} at {pastClass.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{pastClass.duration}</span>
                  </div>
                  <div>
                    <span>Instructor: {pastClass.instructor}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge variant="outline">{pastClass.subject}</Badge>
                  {pastClass.recordingAvailable ? (
                    <Button size="sm" variant="outline">
                      <Play size={14} className="mr-1" />
                      Watch Recording
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-500">Recording not available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Live Class Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• Join classes 5 minutes before the scheduled time</li>
            <li>• Ensure you have a stable internet connection</li>
            <li>• Keep your microphone muted unless asked to speak</li>
            <li>• Use the chat feature for questions during the session</li>
            <li>• Recordings will be available within 24 hours after the class</li>
            <li>• Interactive sessions allow direct Q&A with instructors</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
