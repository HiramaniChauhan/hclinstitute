
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

export const Leaderboard = () => {
  const topPerformers = [
    {
      rank: 1,
      name: "Alex Chen",
      score: 2847,
      change: "+12",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      badges: ["Speed Demon", "Perfect Score"]
    },
    {
      rank: 2,
      name: "Sarah Johnson", 
      score: 2691,
      change: "+5",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b882?w=32&h=32&fit=crop&crop=face",
      badges: ["Consistent", "Math Master"]
    },
    {
      rank: 3,
      name: "David Kim",
      score: 2534,
      change: "-2",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=32&h=32&fit=crop&crop=face",
      badges: ["Physics Pro"]
    }
  ];

  const leaderboardData = [
    { rank: 4, name: "Emma Wilson", score: 2401, change: "+8" },
    { rank: 5, name: "James Brown", score: 2298, change: "+3" },
    { rank: 6, name: "Lisa Garcia", score: 2187, change: "-1" },
    { rank: 7, name: "Michael Davis", score: 2156, change: "+15" },
    { rank: 8, name: "Amy Taylor", score: 2089, change: "+7" },
    { rank: 9, name: "Robert Wilson", score: 1987, change: "-4" },
    { rank: 10, name: "Jennifer Lee", score: 1943, change: "+2" },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          Your Rank: #42
        </Badge>
      </div>

      {/* Top 3 Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topPerformers.map((performer, index) => (
          <Card key={performer.rank} className={`${index === 0 ? 'ring-2 ring-yellow-300' : ''}`}>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                {getRankIcon(performer.rank)}
              </div>
              <Avatar className="h-16 w-16 mx-auto mb-4">
                <AvatarImage src={performer.avatar} />
                <AvatarFallback>{performer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{performer.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{performer.score.toLocaleString()}</p>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{performer.change}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1 mt-3">
                {performer.badges.map((badge) => (
                  <Badge key={badge} variant="outline" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboardData.map((user) => (
              <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center">
                    <span className="text-lg font-bold text-gray-600">#{user.rank}</span>
                  </div>
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg">{user.score.toLocaleString()}</span>
                  <div className={`flex items-center text-sm ${
                    user.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {user.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Your Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Your Performance This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Current Rank</p>
              <p className="text-3xl font-bold text-blue-600">#42</p>
              <p className="text-sm text-green-600">↑ 5 positions</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Score</p>
              <p className="text-3xl font-bold">1,567</p>
              <p className="text-sm text-green-600">+127 this week</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tests Completed</p>
              <p className="text-3xl font-bold">23</p>
              <p className="text-sm text-blue-600">7 this week</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Badges Earned</p>
              <p className="text-3xl font-bold">8</p>
              <p className="text-sm text-yellow-600">2 new badges</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
