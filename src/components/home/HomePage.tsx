
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
  CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAboutInfo, fetchCourses, fetchSelectedStudents } from "@/api/portalApi";

interface HomePageProps {
  onLogin: () => void;
  onRegister: () => void;
  onAdminLogin: () => void;
  onViewAllCourses: () => void;
}

export const HomePage = ({ onLogin, onRegister, onAdminLogin, onViewAllCourses }: HomePageProps) => {
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

  const [about, setAbout] = useState<any>({
    directorName: "Hiramani Chauhan",
    directorBio: "Education is not just about learning facts, but about training the mind to think. At our institute, we don't just teach syllabus; we build careers, shape characters, and ignite the fire of curiosity in every student.",
    directorDesignation: "Director & Founder",
    instituteName: "Hiramani Chauhan Learning Institute",
    instituteDescription: "The premier destination for Mathematics, Reasoning, and Computer Science. Where passion meets perfection under the guidance of experts.",
    contactLinkedin: "#",
    contactInstagram: "#",
    contactEmail: "director@hclinstitute.com",
    establishedYear: "2008",
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
          const updatedAbout = { ...about };
          Object.keys(aboutData).forEach(key => {
            if (aboutData[key] && aboutData[key].trim() !== "") {
              updatedAbout[key] = aboutData[key];
            }
          });
          setAbout(updatedAbout);
        }

        if (coursesData && coursesData.length > 0) {
          setCourses(coursesData.slice(0, 3)); // Show top 3 courses
        }

        if (studentsData && studentsData.length > 0) {
          // Sort by rank ascending (1 is best) and take top 3
          const sortedStudents = [...studentsData].sort((a, b) => {
            const rankA = parseInt(a.rank) || 999999;
            const rankB = parseInt(b.rank) || 999999;
            return rankA - rankB;
          });
          setSelectedStudents(sortedStudents.slice(0, 3));
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
            <div className="flex items-center gap-4 group cursor-pointer">
              {about.instituteLogo ? (
                <div className="w-32 h-32 flex items-center justify-center rounded-full overflow-hidden bg-white/5 border border-white/10">
                  <img src={about.instituteLogo} alt="Institute Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                  <span className="text-5xl font-black text-white px-4">{about.instituteName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'HC'}</span>
                </div>
              )}
              <div className="flex items-center ml-4">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {about.instituteName || 'Institute Name'}
                </h1>
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <div className="flex gap-4">
                <Button
                  onClick={onLogin}
                  className="hidden sm:flex bg-[#ef5350] hover:bg-[#d32f2f] text-white border-none transition-all text-xs font-bold px-6 py-2 rounded shadow-[0_0_15px_rgba(239,83,80,0.3)]"
                >
                  LOGIN
                </Button>
                <Button
                  variant="outline"
                  onClick={onRegister}
                  className="hidden sm:flex border-white/20 text-black hover:bg-white/10 hover:text-white transition-all text-xs font-bold px-6 py-2 rounded"
                >
                  REGISTER
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          {/* Left Text */}
          <div className="flex-1 text-left">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight text-white">
              New standard <br />
              <span className="text-gray-300">in education.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg font-light leading-relaxed">
              {about.instituteDescription}
            </p>
            <div className="flex flex-col sm:flex-row justify-start gap-4">
              <Button
                size="lg"
                onClick={onRegister}
                variant="outline"
                className="h-12 px-8 text-sm border-[#ef5350] text-[#ef5350] bg-transparent hover:bg-[#ef5350] hover:text-white rounded font-medium transition-all uppercase tracking-wider"
              >
                DISCOVER PLATFORM
              </Button>
            </div>


          </div>

          {/* Right Graphic Placeholder */}
          <div className="flex-1 w-full h-full flex justify-center items-center relative">
            <div className="absolute inset-x-0 w-[500px] h-[500px] bg-[#ef5350]/10 rounded-full blur-[100px] z-0"></div>
            <div className="relative z-10 w-full max-w-md bg-[#242428] border border-white/5 rounded-2xl p-8 shadow-2xl skew-y-3 transform hover:skew-y-0 transition-transform duration-500">
              <div className="flex space-x-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#ef5350]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                <div className="h-32 w-full bg-[#ef5350]/20 rounded flex items-end p-4 gap-2">
                  <div className="w-1/4 bg-[#ef5350] h-[40%] rounded-t"></div>
                  <div className="w-1/4 bg-[#ef5350] h-[60%] rounded-t"></div>
                  <div className="w-1/4 bg-[#ef5350] h-[30%] rounded-t"></div>
                  <div className="w-1/4 bg-[#ef5350] h-[80%] rounded-t"></div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[#242428] bg-blue-500"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-[#242428] bg-[#ef5350]"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-[#242428] bg-yellow-500"></div>
                  </div>
                  <span className="text-white font-bold text-xl">Bright Minds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section as Liquid "Multiply wealth" Cards */}
      <section className="py-24 bg-[#141416]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-2">Save time. Get <span className="text-[#ef5350]">higher return</span>.</h2>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-300">Multiply wealth.</h2>
            </div>
          </div>

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

                  {/* Mock graphic for the card */}
                  <div className="h-40 w-full bg-[#1a1a1d] rounded-lg mt-4 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute w-24 h-24 bg-[#ef5350]/20 rounded-full blur-xl"></div>
                    <Calculator className={`w-16 h-16 ${feature.color} z-10 opacity-50`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Courses Section */}
      <section className="py-24 bg-black">
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
                    <p className="text-gray-400 mb-6 text-sm line-clamp-2">{course.description}</p>
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

                    <div className="flex flex-col gap-3 mb-8">
                      <div className="flex items-center text-gray-400 bg-black/40 p-2 rounded-lg text-sm">
                        <Clock className={`w-4 h-4 mr-3 ${theme.color}`} /> {course.duration} Months
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex items-center text-2xl font-bold text-white">
                        <IndianRupee size={24} className={theme.color} />
                        {course.price.toLocaleString()}
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

      {/* About Director */}
      <section className="py-24 relative overflow-hidden bg-[#1A1A1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-[#242428] rounded-2xl p-8 md:p-12 overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ef5350]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 hidden"></div>

            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/10 p-2 relative z-10 bg-[#1a1a1d] shadow-xl">
                  <img
                    src={about.directorPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&crop=face"}
                    alt={about.directorName}
                    className="w-full h-full rounded-full object-cover transition-all duration-500"
                  />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <Badge className="mb-4 bg-[#ef5350]/10 text-[#ef5350] hover:bg-[#ef5350]/20 border-none px-3 py-1 font-bold">Visionary Leader</Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-2 text-white">{about.directorName}</h2>
                <p className="text-xl text-gray-400 font-medium mb-6 tracking-wide">{about.directorDesignation}</p>
                <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-2xl whitespace-pre-line">
                  {about.directorBio}
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 relative bg-[#1A1A1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Wall of <span className="text-[#ef5350]">Fame</span></h2>
            <p className="text-xl text-gray-400">Where our students are making us proud</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {selectedStudents.length > 0 ? selectedStudents.map((student, index) => (
              <div key={index} className={`bg-[#242428] border-none p-8 rounded-xl text-center shadow-xl group hover:-translate-y-2 transition-transform duration-300`}>
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

      {/* Footer */}
      <footer className="bg-[#141416] pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">{about.instituteName}</h2>
            </div>
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
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} {about.instituteName}. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="link" className="text-gray-500 hover:text-red-500 p-0 h-auto" onClick={onAdminLogin}>
                Admin Access
              </Button>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
