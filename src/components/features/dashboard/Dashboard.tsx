
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Calendar
} from "lucide-react";

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome back, John!</h1>
        <Badge variant="secondary" className="text-sm">
          Rank #42
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+2 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124h</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">2 new this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Test */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">Mathematics - Calculus</h3>
              <p className="text-blue-700 text-sm">30 questions • 90 minutes</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-blue-600">Starts at 2:00 PM</span>
                <Button size="sm">Start Test</Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Physics - Mechanics</h3>
              <p className="text-gray-600 text-sm">25 questions • 75 minutes</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm text-gray-500">Starts at 4:30 PM</span>
                <Button variant="outline" size="sm" className="dark:text-gray-200">Set Reminder</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Mathematics</span>
                <span>85%</span>
              </div>
              <Progress value={85} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Physics</span>
                <span>72%</span>
              </div>
              <Progress value={72} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Chemistry</span>
                <span>68%</span>
              </div>
              <Progress value={68} />
            </div>

            <Button className="w-full mt-4" variant="outline">
              View Detailed Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Completed: Organic Chemistry Test</p>
                  <p className="text-sm text-gray-600">Score: 82% • 2 hours ago</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                +50 XP
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Badge Earned: Speed Demon</p>
                  <p className="text-sm text-gray-600">Completed test in record time</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                New!
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
