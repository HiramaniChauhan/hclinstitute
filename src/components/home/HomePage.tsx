
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Award,
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Instagram,
  Trophy,
  Clock,
  IndianRupee,
  ArrowRight,
  Calculator,
  CheckCircle2,
  XCircle,
  Globe,
  AlertTriangle,
  Youtube
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAboutInfo, fetchCourses, fetchSelectedStudents } from "@/api/portalApi";
import { HomePageReviews } from "@/components/features/reviews/HomePageReviews";
import { Link } from "react-router-dom";

interface HomePageProps {
  onLogin: () => void;
  onRegister: () => void;
  onAdminLogin: () => void;
  onViewAllCourses: () => void;
  onViewAllSelectedStudents: () => void;
}

export const HomePage = ({ onLogin, onRegister, onAdminLogin, onViewAllCourses, onViewAllSelectedStudents }: HomePageProps) => {
  const featureCards = [
    {
      id: 1,
      title: "Lectures with Chapter test",
      description: "For better understanding and achieving top scores in your exams.",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    },
    {
      id: 2,
      title: "Separate Test",
      description: "From basic to hard for making you more intelligent and exam-ready.",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20"
    },
    {
      id: 3,
      title: "Live classes + Live Guidance",
      description: "Real-time interaction and expert mentorship to clear all your doubts.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    }
  ];

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const [about, setAbout] = useState<any>({
    directorName: "Hiramani Chauhan",
    directorBio: "",
    directorDesignation: "",
    instituteName: "HCL Institute",
    instituteTagline: "Your Dream, Our Commitment",
    instituteLogo: "/logo.png",
    instituteDescription: "",
    contactLinkedin: "#",
    contactInstagram: "#",
    contactEmail: "hclinstitute.official@gmail.com",
    establishedYear: "2025",
    additionalLinks: [],
    siteNotices: [],
    welcomeVideoUrl: "",
    wallOfFameBottomImage: "",
    heroImageLeft: "",
    heroImageRight: ""
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aboutData, coursesData, studentsData] = await Promise.all([
          fetchAboutInfo(),
          fetchCourses(),
          fetchSelectedStudents().catch(() => []) // fail gracefully
        ]);

        if (Object.keys(aboutData).length > 0) {
          // Map API fields to state fields
          const fieldMapping: Record<string, string> = {
            instituteName: 'instituteName',
            instituteTagline: 'instituteTagline',
            instituteDescription: 'instituteDescription',
            directorName: 'directorName',
            directorBio: 'directorBio',
            directorDesignation: 'directorDesignation',
            instituteLogo: 'instituteLogo',
            directorPhoto: 'directorPhoto',
            directorLinkedin: 'contactLinkedin',
            directorInstagram: 'contactInstagram',
            directorEmail: 'contactEmail',
            additionalLinks: 'additionalLinks',
            welcomeVideoUrl: 'welcomeVideoUrl',
            wallOfFameBottomImage: 'wallOfFameBottomImage',
            heroImageLeft: 'heroImageLeft',
            heroImageRight: 'heroImageRight',
          };

          setAbout(prevAbout => {
            const updatedAbout = { ...prevAbout };
            Object.keys(aboutData).forEach(key => {
              const stateKey = fieldMapping[key] || key;
              if (aboutData[key] !== undefined && aboutData[key] !== null) {
                if (Array.isArray(aboutData[key])) {
                  updatedAbout[stateKey] = aboutData[key];
                } else if (typeof aboutData[key] === 'string' && aboutData[key].trim() !== "") {
                  updatedAbout[stateKey] = aboutData[key];
                }
              }
            });
            return updatedAbout;
          });
        }

        if (coursesData && coursesData.length > 0) {
          setCourses(coursesData.slice(0, 3)); // Show top 3 courses
        }

        if (studentsData && studentsData.length > 0) {
          // Sort by rank ascending (top ranks first) across all years
          // Use year descending as tie-breaker for same ranks
          const sortedStudents = [...studentsData].sort((a, b) => {
            const rankA = parseInt(a.rank) || 999999;
            const rankB = parseInt(b.rank) || 999999;
            if (rankA !== rankB) return rankA - rankB;

            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearB - yearA;
          });
          setSelectedStudents(sortedStudents.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load homepage data", err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-liquid-wave text-white selection:bg-[#ef5350] selection:text-white font-sans overflow-x-hidden">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a1a1d]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 group cursor-pointer">
              {about.instituteLogo ? (
                <div className="w-16 h-16 md:w-32 md:h-32 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-white/5 border border-white/10">
                  <img src={about.instituteLogo} alt="Institute Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 md:w-32 md:h-32 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                  <span className="text-2xl md:text-5xl font-black text-white px-2 md:px-4">{about.instituteName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'HC'}</span>
                </div>
              )}
              <div className="flex flex-col justify-center ml-2 md:ml-4">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white line-clamp-2">
                  {about.instituteName || 'Institute Name'}
                </h1>
                {about.instituteTagline && (
                  <p className="text-[10px] md:text-sm font-medium tracking-[0.15em] md:tracking-[0.25em] text-white/70 uppercase mt-0.5 md:mt-1">
                    {about.instituteTagline}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-center">
              <div className="flex gap-2 sm:gap-4">
                <Button
                  onClick={onLogin}
                  className="flex bg-[#ef5350] hover:bg-[#d32f2f] text-white border-none transition-all text-[10px] sm:text-xs font-bold px-3 sm:px-6 py-1.5 sm:py-2 rounded shadow-[0_0_15px_rgba(239,83,80,0.3)] h-auto"
                >
                  LOGIN
                </Button>
                <Button
                  variant="outline"
                  onClick={onRegister}
                  className="flex border-white/20 text-black hover:bg-white/10 hover:text-white transition-all text-[10px] sm:text-xs font-bold px-3 sm:px-6 py-1.5 sm:py-2 rounded h-auto"
                >
                  REGISTER
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Site Notice Marquee */}
      {about.siteNotices && about.siteNotices.filter((n: string) => n?.trim()).length > 0 && (
        <div className="bg-amber-500 text-black py-2.5 overflow-hidden w-full">
          <div className="animate-marquee whitespace-nowrap inline-block w-max">
            {about.siteNotices.filter((n: string) => n?.trim()).map((notice: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-3 text-sm font-semibold mx-12 md:mx-32">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {notice}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hero Banner Section */}
      {(about.heroImageLeft || about.heroImageRight) && (
        <section className="relative pt-8 pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden z-10 bg-[#1a1a1d]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left Image */}
              {about.heroImageLeft && (
                <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-[#242428]">
                  <img
                    src={about.heroImageLeft}
                    alt="Hero Banner Left"
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}
              {/* Right Image */}
              {about.heroImageRight && (
                <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-[#242428]">
                  <img
                    src={about.heroImageRight}
                    alt="Hero Banner Right"
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Courses Section as Liquid "Multiply wealth" Cards */}
      <section className="py-24 bg-[#141416]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-2">Save time. Get <span className="text-[#ef5350]">higher return</span>.</h2>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-300">Multiply wealth.</h2>
            </div>
          </div>

          {/* Welcome Video Section (Optional) */}
          {about.welcomeVideoUrl && (
            <div className="mb-16 w-full max-w-4xl mx-auto overflow-hidden rounded-2xl shadow-2xl border border-white/10 aspect-video bg-[#242428]">
              {about.welcomeVideoUrl.includes('youtube.com') || about.welcomeVideoUrl.includes('youtu.be') ? (
                <iframe
                  className="w-full h-full"
                  src={(() => {
                    let videoId = "";
                    if (about.welcomeVideoUrl.includes('v=')) {
                      videoId = about.welcomeVideoUrl.split('v=')[1].split('&')[0];
                    } else if (about.welcomeVideoUrl.includes('youtu.be/')) {
                      videoId = about.welcomeVideoUrl.split('youtu.be/')[1].split('?')[0];
                    } else if (about.welcomeVideoUrl.includes('embed/')) {
                      videoId = about.welcomeVideoUrl.split('embed/')[1].split('?')[0];
                    } else if (about.welcomeVideoUrl.includes('shorts/')) {
                      videoId = about.welcomeVideoUrl.split('shorts/')[1].split('?')[0];
                    } else if (about.welcomeVideoUrl.includes('live/')) {
                      videoId = about.welcomeVideoUrl.split('live/')[1].split('?')[0];
                    }
                    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : about.welcomeVideoUrl;
                  })()}
                  title="Welcome Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video 
                  src={about.welcomeVideoUrl} 
                  autoPlay 
                  loop 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureCards.map((feature) => (
              <Card key={feature.id} className="bg-[#242428] border-none hover:bg-[#2a2a2e] transition-all duration-300 group rounded-xl overflow-hidden shadow-xl">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 mb-4 rounded-lg flex items-center justify-center ${feature.bg}`}>
                    <Award className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-6 text-sm leading-relaxed">{feature.description}</p>

                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Success Stories */}
      <section className="py-24 relative bg-[#1A1A1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="text-left">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Wall of <span className="text-[#ef5350]">Fame</span></h2>
              <p className="text-xl text-gray-400">Where our students are making us proud</p>
            </div>
            <Button
              onClick={onViewAllSelectedStudents}
              className="bg-white text-black hover:bg-gray-200 border-none transition-all text-xs font-bold px-6 py-2 rounded shadow-lg flex items-center uppercase tracking-wider"
            >
              SEE ALL <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
            {selectedStudents.length > 0 ? selectedStudents.map((student, index) => (
              <div key={index} className={`bg-[#242428] border-none p-6 md:p-8 rounded-xl text-center shadow-xl group hover:-translate-y-2 transition-transform duration-300 w-full max-w-[300px]`}>
                <div className="mx-auto w-52 h-52 mb-6 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/10 bg-[#1a1a1d] shadow-lg">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <Trophy className="w-20 h-20 text-yellow-500 opacity-50" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{student.name}</h3>
                <div className="text-gray-400 font-medium text-sm mb-6 line-clamp-2">{student.collegeAllotted || "Selected Student"}</div>
                <div className="flex justify-center items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                    Rank {student.rank || "-"}
                  </Badge>
                  {student.year && (
                    <Badge variant="outline" className="text-white border-white/20 bg-white/10 px-3 py-1">
                      {student.year}
                    </Badge>
                  )}
                  {student.linkedinId && (
                    <a href={student.linkedinId.startsWith('http') ? student.linkedinId : `https://${student.linkedinId}`} target="_blank" rel="noopener noreferrer" className="ml-2 w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {student.additionalLink && (
                    <a href={student.additionalLink.startsWith('http') ? student.additionalLink : `https://${student.additionalLink}`} target="_blank" rel="noopener noreferrer" className="ml-1 w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all">
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center text-gray-500 py-12">
                No success stories available yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Standalone Achievement/Banner Image (Optional) */}
      {about.wallOfFameBottomImage && (
        <section className="py-12 bg-[#141416]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl mx-auto overflow-hidden rounded-2xl shadow-2xl border border-white/5">
              <img 
                src={about.wallOfFameBottomImage} 
                alt="Institute Achievements" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </section>
      )}

      {/* Courses Section */}
      <section className="py-24 bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="text-left">
              <h2 className="text-4xl md:text-5xl font-black mb-4"><span className="text-white">World Class</span> <span className="text-blue-500">Curriculum</span></h2>
              <div className="h-1 w-20 bg-blue-500 rounded-full"></div>
            </div>
            <Button
              onClick={onViewAllCourses}
              className="bg-white text-black hover:bg-gray-200 border-none transition-all text-xs font-bold px-6 py-2 rounded shadow-lg flex items-center uppercase tracking-wider"
            >
              FIND OUT MORE <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.length > 0 ? courses.map((course, index) => {
              const colors = [
                { color: "text-blue-500", bg: "bg-blue-500", border: "border-blue-500/20" },
                { color: "text-green-500", bg: "bg-green-500", border: "border-green-500/20" },
                { color: "text-purple-500", bg: "bg-purple-500", border: "border-purple-500/20" }
              ];
              const theme = colors[index % colors.length];

              return (
                <Card key={course.id} className={`bg-gray-900/50 border ${theme.border} hover:bg-gray-900 transition-all duration-300 group hover:-translate-y-2`}>
                  <CardHeader>
                    <CardTitle className={`text-2xl font-bold ${theme.color}`}>{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <p className={`text-gray-400 text-sm ${expandedDescriptions[course.id] ? '' : 'line-clamp-2'}`}>{course.description}</p>
                      {course.description && course.description.length > 80 && (
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium mt-1 cursor-pointer hover:underline"
                          onClick={() =>
                            setExpandedDescriptions(prev => ({
                              ...prev,
                              [course.id]: !prev[course.id],
                            }))
                          }
                        >
                          {expandedDescriptions[course.id] ? 'Show less' : '...more'}
                        </button>
                      )}
                    </div>
                    {course.accessFeatures && course.accessFeatures.length > 0 && (
                      <div className="mb-6 flex flex-wrap gap-2">
                        {course.accessFeatures.map((f: string, i: number) => (
                          <div key={i} className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded bg-black/40 ${theme.color} border border-white/5`}>
                            <CheckCircle2 className="w-3 h-3 mr-1.5 opacity-70" />
                            {f}
                          </div>
                        ))}
                      </div>
                    )}

                    {course.pointableFeatures && course.pointableFeatures.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {course.pointableFeatures.map((feat: string, i: number) => (
                          <div key={i} className="flex items-start text-sm text-gray-300">
                            <CheckCircle2 className={`w-4 h-4 mr-2 shrink-0 ${theme.color}`} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {course.excludedFeatures && course.excludedFeatures.length > 0 && (
                      <div className="mb-6 space-y-2">
                        {course.excludedFeatures.map((feat: string, i: number) => (
                          <div key={i} className="flex items-start text-sm text-red-400/80">
                            <XCircle className="w-4 h-4 mr-2 shrink-0 text-red-500" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 mb-8">
                      <div className="flex items-center text-gray-400 bg-black/40 p-2 rounded-lg text-sm">
                        <Clock className={`w-4 h-4 mr-3 ${theme.color}`} /> {course.duration} Months
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-2xl font-bold text-white">
                          <IndianRupee size={24} className={theme.color} />
                          {course.price.toLocaleString()}
                        </div>
                        {course.originalPrice && Number(course.originalPrice) > Number(course.price) && (
                          <span className="relative inline-flex items-center">
                            <span className="text-lg font-semibold text-red-400/80">₹{Number(course.originalPrice).toLocaleString()}</span>
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
                              <span className="block w-[110%] h-[2px] bg-red-500 -rotate-12 rounded-full"></span>
                            </span>
                          </span>
                        )}
                      </div>
                      <Button onClick={onRegister} className={`${theme.bg} text-white hover:bg-white hover:text-black transition-all font-bold`}>
                        Enroll Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="col-span-3 text-center text-gray-500 py-12">
                No courses available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Student Reviews */}
      <HomePageReviews />

      {/* About Director */}
      <section className="py-24 relative overflow-hidden bg-[#1A1A1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-[#242428] rounded-2xl p-4 sm:p-6 md:p-12 overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ef5350]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 hidden"></div>

            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/10 p-2 relative z-10 bg-[#1a1a1d] shadow-xl">
                  <img
                    src={about.directorPhoto}
                    alt={about.directorName}
                    className="w-full h-full rounded-full object-cover transition-all duration-500"
                  />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <Badge className="mb-4 bg-[#ef5350]/10 text-[#ef5350] hover:bg-[#ef5350]/20 border-none px-3 py-1 font-bold">Visionary Leader</Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-2 text-white">{about.directorName}</h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-2xl whitespace-pre-line">
                  {about.directorBio}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                  {about.contactLinkedin && about.contactLinkedin !== "#" && (
                    <a href={about.contactLinkedin.startsWith('http') ? about.contactLinkedin : `https://${about.contactLinkedin}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="border-white/10 text-black hover:bg-[#ef5350] hover:text-white transition-all rounded">
                        <Linkedin className="mr-2 h-4 w-4" /> Connect
                      </Button>
                    </a>
                  )}
                  {about.contactInstagram && about.contactInstagram !== "#" && (
                    <a href={about.contactInstagram.startsWith('http') ? about.contactInstagram : `https://instagram.com/${about.contactInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="border-white/10 text-black hover:bg-pink-600 hover:text-white transition-all rounded">
                        <Instagram className="mr-2 h-4 w-4" /> Follow
                      </Button>
                    </a>
                  )}
                  {about.additionalLinks && about.additionalLinks.map((link: any, index: number) => {
                    const isYoutube = link.title.toLowerCase().includes('youtube');
                    const isFacebook = link.title.toLowerCase().includes('facebook');
                    const isTwitter = link.title.toLowerCase().includes('twitter') || link.title.toLowerCase().includes('x');

                    return (
                      <a key={index} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="border-white/10 text-black hover:bg-blue-600 hover:text-white transition-all rounded group">
                          {isYoutube ? <span className="font-bold text-red-500 group-hover:text-white mr-2">YT</span> :
                            isFacebook ? <span className="font-bold text-blue-500 group-hover:text-white mr-2">f</span> :
                              isTwitter ? <span className="font-bold mr-2 text-black group-hover:text-white">𝕏</span> :
                                <Globe className="mr-2 h-4 w-4" />}
                          {link.title}
                        </Button>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-[#141416] pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">{about.instituteName}</h2>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm font-bold uppercase tracking-wider text-gray-500">Contact Us</span>
              <div className="flex gap-6">
                {about.contactLinkedin && about.contactLinkedin !== "#" && (
                  <a href={about.contactLinkedin.startsWith('http') ? about.contactLinkedin : `https://${about.contactLinkedin}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {about.contactInstagram && about.contactInstagram !== "#" && (
                  <a href={about.contactInstagram.startsWith('http') ? about.contactInstagram : `https://instagram.com/${about.contactInstagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {about.contactEmail && (
                  <a href={`mailto:${about.contactEmail}`} className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
                    <Mail className="w-5 h-5" />
                  </a>
                )}
                {about.additionalLinks && about.additionalLinks.map((link: any, index: number) => {
                  const isYoutube = link.title.toLowerCase().includes('youtube');
                  const isFacebook = link.title.toLowerCase().includes('facebook');
                  const isTwitter = link.title.toLowerCase().includes('twitter') || link.title.toLowerCase().includes('x');

                  return (
                    <a key={index} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                      {isYoutube ? <span className="font-bold text-red-500 group-hover:text-white">YT</span> :
                        isFacebook ? <span className="font-bold text-blue-500 group-hover:text-white font-serif">f</span> :
                          isTwitter ? <span className="font-bold text-black group-hover:text-white">𝕏</span> :
                            <Globe className="w-5 h-5" />}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <div className="flex gap-4">
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <p>&copy; {new Date().getFullYear()} HCL Institute. All rights reserved</p>
              <Button variant="link" className="text-gray-500 hover:text-red-500 p-0 h-auto" onClick={onAdminLogin}>
                .
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
