
import { useState, useEffect } from "react";
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

        let validResults = resultsData || [];
        if (Array.isArray(resultsData) && Array.isArray(testsData)) {
          const validTestIds = new Set(testsData.map((t: any) => String(t.testId || t.id)));
          validResults = resultsData.filter((r: any) => validTestIds.has(String(r.testId)));
        }

        if (Array.isArray(validResults)) {
          setUserResults(validResults);
          // Best rank from last 20 tests
          const last20 = [...validResults]
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

  const overallAccuracy = (() => {
    if (userResults.length === 0) return '—';
    const valid = userResults.filter(r => r.totalQuestions > 0);
    if (valid.length === 0) return '—';
    const avg = valid.reduce((s, r) => s + (r.correctAnswers / r.totalQuestions), 0) / valid.length;
    return `${(avg * 100).toFixed(1)}%`;
  })();

  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="dashboard-premium space-y-5">

      {/* ─── GREETING ─── */}
      <div className="db-fade-up">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-2"
          style={{ background: 'var(--db-amber-dim)', border: '1px solid var(--db-border-amber)', color: 'var(--db-amber)' }}
        >
          🌿 {dateStr}
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: 'var(--db-warm-dark)', letterSpacing: '-0.5px' }}>
          {greeting}, <em style={{ color: 'var(--db-sage)', fontStyle: 'italic' }}>{firstName}</em> ✨
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--db-warm-gray)' }}>
          You've completed {userResults.length} test{userResults.length !== 1 ? 's' : ''} — keep going!
        </p>
      </div>

      {/* ─── STATS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tests Completed */}
        <div className="db-stat-card sc-sage db-fade-up-1">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--db-sage-dim)' }}>
              🎯
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(74,124,89,0.12)', color: 'var(--db-sage)' }}>
              <Target size={10} className="inline mr-1" />Tests
            </span>
          </div>
          <div className="font-display font-bold text-3xl tracking-tight leading-none mb-1" style={{ color: 'var(--db-sage)' }}>
            {String(userResults.length).padStart(2, '0')}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--db-warm-gray)' }}>Tests Completed</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#b5ad9f' }}>
            {userResults.length === 1 ? '1 total attempt' : `${userResults.length} total attempts`}
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="db-stat-card sc-amber db-fade-up-2">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'var(--db-amber-dim)' }}>
              📊
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'var(--db-cream-dark)', color: 'var(--db-warm-gray)' }}>
              <TrendingUp size={10} className="inline mr-1" />Accuracy
            </span>
          </div>
          <div className="font-display font-bold text-3xl tracking-tight leading-none mb-1" style={{ color: 'var(--db-amber)' }}>
            {overallAccuracy}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--db-warm-gray)' }}>Overall Accuracy</div>
          <div className="text-[11px] mt-0.5" style={{ color: '#b5ad9f' }}>avg correct / total questions</div>
        </div>
      </div>

      {/* ─── LIVE CLASSES ─── */}
      {activeLiveClasses.length > 0 && (
        <div className="db-card db-fade-up-3">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-[15px] font-semibold flex items-center gap-2" style={{ color: 'var(--db-warm-dark)' }}>
              <Video size={16} style={{ color: 'var(--db-sage)' }} />
              Live Classes Now
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
              style={{ background: 'rgba(193,127,36,0.1)', border: '1px solid rgba(193,127,36,0.22)', color: 'var(--db-amber)' }}
            >
              <div className="db-live-dot" />
              LIVE
            </div>
          </div>

          {activeLiveClasses.map((liveClass: any) => (
            <div key={liveClass.id} className="db-class-row">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: 'var(--db-sage)', color: '#fff' }}
              >
                <Video size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--db-warm-dark)' }}>{liveClass.title}</div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {liveClass.subject && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-semibold"
                      style={{ background: 'var(--db-sage-dim)', border: '1px solid var(--db-border)', color: 'var(--db-sage)' }}
                    >
                      {liveClass.subject}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <button className="db-btn-main" onClick={() => handleJoinLiveClass(liveClass.url)}>
                  ▶ Join Now
                </button>
                <button
                  className="bg-transparent border rounded-lg px-3 py-2 text-xs cursor-pointer transition-all hover:border-[var(--db-sage)] hover:text-[var(--db-sage)]"
                  style={{ borderColor: 'var(--db-border)', color: 'var(--db-warm-mid)' }}
                  onClick={navigateToLiveClasses}
                >
                  Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TODAY'S TESTS ─── */}
      <div className="db-card db-fade-up-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-[15px] font-semibold flex items-center gap-2" style={{ color: 'var(--db-warm-dark)' }}>
            <Calendar size={16} style={{ color: 'var(--db-amber)' }} />
            Today's Live Tests
          </div>
          {activeTests.length > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: 'var(--db-amber-dim)', border: '1px solid var(--db-border-amber)', color: 'var(--db-amber)' }}
            >
              <Zap size={10} /> {activeTests.length} Active
            </div>
          )}
        </div>

        {loadingTests ? (
          <div className="text-center py-6 text-sm" style={{ color: 'var(--db-warm-gray)' }}>Loading tests...</div>
        ) : activeTests.length === 0 ? (
          <div className="text-center py-8">
            <div className="db-test-row justify-center" style={{ background: 'var(--db-cream)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: 'var(--db-sage-dim)' }}>🧪</div>
              <div className="flex-1 text-left">
                <div className="text-[13px] font-semibold" style={{ color: 'var(--db-warm-dark)' }}>No live tests right now</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--db-warm-gray)' }}>Check the Tests tab for upcoming & practice tests</div>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                style={{ background: 'var(--db-sage-dim)', border: '1px solid var(--db-border)', color: 'var(--db-sage)' }}
              >
                ALL DONE
              </span>
            </div>
            <button className="db-go-btn" onClick={navigateToTests}>
              <ChevronRight size={13} /> Go to Tests
            </button>
          </div>
        ) : (
          <>
            {activeTests.map((test: any) => {
              const testId = test.testId || test.id;
              const attempts = getAttemptCount(testId);
              const maxed = attempts >= 2;
              const totalQ = test.sections?.reduce((a: number, s: any) => a + s.questions.length, 0) ?? 0;

              return (
                <div key={String(testId)} className="db-test-row" style={maxed ? { background: 'var(--db-cream-dark)', opacity: 0.7 } : {}}>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: maxed ? 'var(--db-cream-deep)' : 'var(--db-sage-dim)' }}
                  >
                    📝
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--db-warm-dark)' }}>{test.title}</span>
                      {!maxed && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--db-amber-dim)', border: '1px solid var(--db-border-amber)', color: 'var(--db-amber)' }}
                        >
                          🔴 LIVE NOW
                        </span>
                      )}
                      {maxed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--db-cream-deep)', color: 'var(--db-warm-gray)' }}>
                          Attempted (2/2)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--db-warm-gray)' }}>
                      {totalQ} questions • {test.duration} min{test.subject && ` • ${test.subject}`}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {test.sections?.map((s: any) => (
                        <span
                          key={s.id}
                          className="text-[10px] px-2 py-0.5 rounded font-semibold"
                          style={{ background: 'var(--db-sage-dim)', border: '1px solid var(--db-border)', color: 'var(--db-sage)' }}
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color: 'var(--db-warm-gray)' }}>
                      <AlertCircle size={11} /> Ends: {test.endDate} at {test.endTime}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    {!maxed ? (
                      <button className="db-btn-main" onClick={navigateToTests}>Start Test →</button>
                    ) : (
                      <button
                        className="bg-transparent border rounded-lg px-3 py-2 text-xs cursor-pointer transition-all hover:border-[var(--db-sage)] hover:text-[var(--db-sage)]"
                        style={{ borderColor: 'var(--db-border)', color: 'var(--db-warm-mid)' }}
                        onClick={navigateToTests}
                      >
                        Review →
                      </button>
                    )}
                    <span className="text-[10px]" style={{ color: '#b5ad9f' }}>{attempts}/2 attempts used</span>
                  </div>
                </div>
              );
            })}
            <button className="db-go-btn" onClick={navigateToTests}>
              <ChevronRight size={13} /> Go to Tests
            </button>
          </>
        )}
      </div>
    </div>
  );
};
