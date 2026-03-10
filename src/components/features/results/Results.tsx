
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Award, Calendar } from "lucide-react";

export const Results = () => {
  const recentResults = [
    {
      id: 1,
      testName: "Mathematics - Calculus",
      score: 85,
      maxScore: 100,
      percentile: 92,
      date: "2024-01-15",
      trend: "up",
      rank: 23
    },
    {
      id: 2,
      testName: "Physics - Mechanics",
      score: 72,
      maxScore: 100,
      percentile: 78,
      date: "2024-01-14",
      trend: "down",
      rank: 45
    },
    {
      id: 3,
      testName: "Chemistry - Organic",
      score: 91,
      maxScore: 100,
      percentile: 96,
      date: "2024-01-12",
      trend: "up",
      rank: 12
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Test Results</h1>
        <Button variant="outline">Download Report</Button>
      </div>

      {/* Overall Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Average Score</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-blue-600">82.7%</div>
            <p className="text-sm text-gray-600 mt-2">Last 10 tests</p>
            <div className="flex items-center justify-center mt-2 text-green-600">
              <TrendingUp size={16} className="mr-1" />
              <span className="text-sm">+5.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Best Rank</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-green-600">#12</div>
            <p className="text-sm text-gray-600 mt-2">Chemistry - Organic</p>
            <Badge variant="secondary" className="mt-2">
              <Award size={12} className="mr-1" />
              Top 5%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Tests Taken</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold text-purple-600">23</div>
            <p className="text-sm text-gray-600 mt-2">This month</p>
            <div className="flex items-center justify-center mt-2 text-blue-600">
              <Calendar size={16} className="mr-1" />
              <span className="text-sm">2 more than target</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentResults.map((result) => (
              <div key={result.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{result.testName}</h3>
                  <Badge variant="outline">{result.date}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-2xl font-bold">{result.score}/{result.maxScore}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Percentile</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{result.percentile}%</p>
                      {result.trend === 'up' ? (
                        <TrendingUp className="text-green-500" size={20} />
                      ) : (
                        <TrendingDown className="text-red-500" size={20} />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Rank</p>
                    <p className="text-2xl font-bold">#{result.rank}</p>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm">View Analysis</Button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Performance</span>
                    <span>{result.score}%</span>
                  </div>
                  <Progress value={result.score} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Mathematics</span>
              <span className="text-sm text-gray-600">Average: 85%</span>
            </div>
            <Progress value={85} />
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Physics</span>
              <span className="text-sm text-gray-600">Average: 78%</span>
            </div>
            <Progress value={78} />
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Chemistry</span>
              <span className="text-sm text-gray-600">Average: 82%</span>
            </div>
            <Progress value={82} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
