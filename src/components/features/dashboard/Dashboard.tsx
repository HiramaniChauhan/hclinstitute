
import { useState, useEffect } from "react";
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
  Calendar,
  AlertCircle,
  Zap,
  ChevronRight,
  Video
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export const Dashboard = () => {
  const { user } = useAuth();
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [activeLiveClasses, setActiveLiveClasses] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [accessFeatures, setAccessFeatures] = useState<string[]>([]);
  const [bestRank, setBestRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      try {
        const [testsResp, resultsResp, videosResp, accessResp] = await Promise.all([
          fetch('/api/tests', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/results/my-results', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/videos', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/enrollments/my-access', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const testsData = await testsResp.json();
        const resultsData = await resultsResp.json();
        const videosData = await videosResp.json();
        const accessData = await accessResp.json();

        if (accessData && Array.isArray(accessData.accessFeatures)) {
          setAccessFeatures(accessData.accessFeatures);
        }

        if (Array.isArray(videosData)) {
          const live = videosData.filter((v: any) => v.type === 'live' && v.status === 'Live');
          setActiveLiveClasses(live);
        }

        if (Array.isArray(resultsData)) {
          setUserResults(resultsData);
          // Best rank from last 20 tests
          const last20 = [...resultsData]
            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, 20);
          const ranks = last20.map((r: any) => r.rank).filter((r: any) => typeof r === 'number');
          if (ranks.length > 0) setBestRank(Math.min(...ranks));
        }
        if (Array.isArray(testsData)) {
          const now = new Date();
          // Only show tests that are currently within their start→end window
          const live = testsData.filter((t: any) => {
            if (!t.startDate || !t.startTime) return false;
            const start = new Date(`${t.startDate}T${t.startTime}`);
            const end = t.endDate ? new Date(`${t.endDate}T${t.endTime || '23:59'}`) : null;
            return now >= start && (!end || now <= end);
          });
          setActiveTests(live);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingTests(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getAttemptCount = (testId: string | number) =>
    userResults.filter(r => String(r.testId) === String(testId)).length;

  const navigateToTests = () => {
    // Navigate to Tests tab — fire a custom event the portal can listen to
    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'tests' }));
  };

  const navigateToLiveClasses = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'live-classes' }));
  };

  const handleJoinLiveClass = (url: string) => {
    if (!accessFeatures.includes('Live Classes')) {
      toast.error("Access Denied", {
        description: "You need to enroll in a course with Live Classes to join.",
        duration: 5000
      });
      window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'courses' }));
      return;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Tests Completed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userResults.length}</div>
            <p className="text-xs text-muted-foreground">
              {userResults.length === 1 ? '1 total attempt' : `${userResults.length} total attempts`}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Overall Accuracy = avg(correctAnswers / totalQuestions) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userResults.length > 0
                ? (() => {
                  const valid = userResults.filter(r => r.totalQuestions > 0);
                  if (valid.length === 0) return '—';
                  const avg = valid.reduce((s, r) => s + (r.correctAnswers / r.totalQuestions), 0) / valid.length;
                  return `${(avg * 100).toFixed(1)}%`;
                })()
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">avg correct / total questions</p>
          </CardContent>
        </Card>

        {/* Card 3: Best Rank from last 20 tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Rank</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bestRank !== null ? `#${bestRank}` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">in last 20 tests</p>
          </CardContent>
        </Card>

      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Active Live Classes (Only show if there are any) */}
        {activeLiveClasses.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Video className="h-5 w-5 animate-pulse" />
                Live Classes Happening Now!
              </CardTitle>
              <Badge className="bg-red-500 animate-pulse text-white">
                LIVE
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {activeLiveClasses.map((liveClass: any) => (
                  <div key={liveClass.id} className="p-4 rounded-xl border border-red-100 bg-red-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <h3 className="font-semibold text-gray-900 pr-6 relative z-10">{liveClass.title}</h3>
                    {liveClass.subject && (
                      <Badge variant="outline" className="mt-2 bg-white/50 border-red-200 text-red-700">
                        {liveClass.subject}
                      </Badge>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="w-full bg-red-600 hover:bg-red-700" onClick={() => handleJoinLiveClass(liveClass.url)}>
                        <Video size={14} className="mr-1" />
                        Join Now
                      </Button>
                      <Button size="sm" variant="outline" className="w-full bg-white bg-opacity-50" onClick={navigateToLiveClasses}>
                        Details →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Active Tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Live Tests
            </CardTitle>
            {activeTests.length > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse">
                <Zap size={12} className="mr-1" /> {activeTests.length} Active
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingTests ? (
              <div className="text-center py-6 text-gray-400 text-sm">Loading tests...</div>
            ) : activeTests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium text-gray-500">No live tests right now</p>
                <p className="text-sm mt-1">Check the Tests tab for upcoming &amp; practice tests</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={navigateToTests}>
                  Go to Tests <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            ) : (
              activeTests.map((test: any) => {
                const testId = test.testId || test.id;
                const attempts = getAttemptCount(testId);
                const maxed = attempts >= 2;
                const totalQ = test.sections?.reduce((a: number, s: any) => a + s.questions.length, 0) ?? 0;

                return (
                  <div key={String(testId)}
                    className={`p-4 rounded-xl border-2 ${maxed
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-green-200 bg-green-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{test.title}</h3>
                          {!maxed && (
                            <Badge className="bg-green-500 text-white text-[10px] px-2">
                              🔴 LIVE NOW
                            </Badge>
                          )}
                          {maxed && (
                            <Badge variant="secondary" className="text-[10px]">
                              Attempted (2/2)
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {totalQ} questions • {test.duration} min
                          {test.subject && ` • ${test.subject}`}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {test.sections?.map((s: any) => (
                            <Badge key={s.id} variant="outline" className="text-[10px] text-blue-700 border-blue-200 bg-blue-50">
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                          <AlertCircle size={11} />
                          Ends: {test.endDate} at {test.endTime}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {!maxed ? (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 shadow"
                            onClick={navigateToTests}
                          >
                            Start Test →
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={navigateToTests}>
                            Review →
                          </Button>
                        )}
                        <span className="text-[10px] text-gray-500">{attempts}/2 attempts used</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
