
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
  Sparkles,
  ArrowRight,
  Calculator
} from "lucide-react";

interface HomePageProps {
  onLogin: () => void;
  onRegister: () => void;
  onAdminLogin: () => void;
}

export const HomePage = ({ onLogin, onRegister, onAdminLogin }: HomePageProps) => {
  const courses = [
    {
      id: 1,
      title: "Master Mathematics",
      description: "From basics to advanced calculus, conquer numbers with confidence.",
      price: 4999,
      duration: "6 Months",
      enrolled: 245,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    },
    {
      id: 2,
      title: "Reasoning & Logic",
      description: "Sharpen your mind and master logical reasoning for competitive exams.",
      price: 3999,
      duration: "4 Months",
      enrolled: 189,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20"
    },
    {
      id: 3,
      title: "Computer Science",
      description: "Build a solid foundation in programming and algorithms.",
      price: 5999,
      duration: "8 Months",
      enrolled: 156,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    }
  ];

  const results = [
    { name: "Rahul Sharma", company: "Google", package: "₹45 LPA", score: "98.5%", color: "border-blue-500" },
    { name: "Priya Patel", company: "Microsoft", package: "₹42 LPA", score: "97.8%", color: "border-red-500" },
    { name: "Amit Kumar", company: "Amazon", package: "₹38 LPA", score: "96.2%", color: "border-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500 selection:text-white font-sans">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 group cursor-pointer">
              <div className="w-20 h-20 bg-gradient-to-tr from-red-600 via-yellow-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-red-500/20">
                <span className="text-5xl font-black text-white">H</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Hiramani Chauhan Learning Institute
                </h1>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onLogin}
                className="hidden md:flex border-white/20 text-black hover:bg-white/10 hover:text-white transition-all uppercase tracking-wider font-bold"
              >
                Login
              </Button>
              <Button
                onClick={onRegister}
                className="bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] transition-all uppercase tracking-wider font-bold px-8"
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        {/* Background Elements - Removed for clean dark theme diff */}

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-4 py-1 text-sm rounded-full backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2 fill-yellow-500" /> Only Place for Excellence
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight">
            Review Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-red-500">
              Potential
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            The premier destination for <span className="text-white font-semibold">Mathematics</span>, <span className="text-white font-semibold">Reasoning</span>, and <span className="text-white font-semibold">Computer Science</span>.
            Where passion meets perfection under the guidance of experts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button
              size="lg"
              onClick={onRegister}
              className="h-14 px-10 text-lg bg-blue-600 hover:bg-blue-700 shadow-[0_0_30px_rgba(37,99,235,0.4)] rounded-full font-bold transition-transform hover:scale-105"
            >
              Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 text-lg border-white/20 text-black hover:bg-white/10 hover:text-white rounded-full font-bold backdrop-blur-sm transition-transform hover:scale-105"
            >
              View Courses
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-blue-500/20">
                <Users className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-4xl font-black text-white mb-1">500+</h3>
              <p className="text-blue-400 font-medium">Active Students</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors border border-green-500/20">
                <Award className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-4xl font-black text-white mb-1">98%</h3>
              <p className="text-green-400 font-medium">Success Rate</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors border border-purple-500/20">
                <BookOpen className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-4xl font-black text-white mb-1">15+</h3>
              <p className="text-purple-400 font-medium">Premium Courses</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-4 bg-yellow-500/10 rounded-2xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors border border-yellow-500/20">
                <Trophy className="h-10 w-10 text-yellow-500" />
              </div>
              <h3 className="text-4xl font-black text-white mb-1">100+</h3>
              <p className="text-yellow-400 font-medium">Top Placements</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Director */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-gray-900 to-black rounded-3xl border border-white/10 p-8 md:p-12 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 hidden"></div>

            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-red-500 p-2 relative z-10">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&crop=face"
                    alt="Hiramani Chauhan"
                    className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div className="absolute inset-0 bg-red-500/5 rounded-full blur-2xl -z-10 hidden"></div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <Badge className="mb-4 bg-red-500 text-white hover:bg-red-600 border-none px-3 py-1">Visionary Leader</Badge>
                <h2 className="text-4xl md:text-5xl font-bold mb-2 text-white">Hiramani Chauhan</h2>
                <p className="text-xl text-red-500 font-medium mb-6 tracking-wide">Director & Founder</p>
                <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-2xl">
                  "Education is not just about learning facts, but about training the mind to think. At our institute, we don't just teach syllabus; we build careers, shape characters, and ignite the fire of curiosity in every student."
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <Button variant="outline" className="border-white/20 text-black hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all">
                    <Linkedin className="mr-2 h-4 w-4" /> Connect
                  </Button>
                  <Button variant="outline" className="border-white/20 text-black hover:bg-pink-600 hover:border-pink-600 hover:text-white transition-all">
                    <Instagram className="mr-2 h-4 w-4" /> Follow
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4"><span className="text-white">World Class</span> <span className="text-blue-500">Curriculum</span></h2>
            <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card key={course.id} className={`bg-gray-900/50 border ${course.border} hover:bg-gray-900 transition-all duration-300 group hover:-translate-y-2`}>
                <CardHeader>
                  <CardTitle className={`text-2xl font-bold ${course.color}`}>{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-6 text-lg">{course.description}</p>

                  <div className="flex flex-col gap-3 mb-8">
                    <div className="flex items-center text-gray-400 bg-black/40 p-2 rounded-lg">
                      <Clock className={`w-5 h-5 mr-3 ${course.color}`} /> {course.duration}
                    </div>
                    <div className="flex items-center text-gray-400 bg-black/40 p-2 rounded-lg">
                      <Users className={`w-5 h-5 mr-3 ${course.color}`} /> {course.enrolled} Students
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="flex items-center text-2xl font-bold text-white">
                      <IndianRupee size={24} className={course.color} />
                      {course.price.toLocaleString()}
                    </div>
                    <Button className={`${course.bg} ${course.color} hover:bg-white hover:text-black transition-all font-bold`}>
                      Enroll Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-blue-900/10 skew-y-3 transform origin-bottom-left -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">Wall of <span className="text-yellow-500">Fame</span></h2>
            <p className="text-xl text-gray-400">Where our students are making us proud</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {results.map((result, index) => (
              <div key={index} className={`bg-black border ${result.color} p-8 rounded-2xl text-center hover:scale-105 transition-transform duration-300 relative group`}>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-900 rounded-full border border-gray-700 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mt-4 mb-2">{result.name}</h3>
                <div className="text-blue-400 font-semibold text-lg mb-4">{result.company}</div>
                <div className="flex justify-center gap-4">
                  <Badge variant="outline" className="text-green-400 border-green-400/30 px-3 py-1 text-lg">{result.package}</Badge>
                  <Badge variant="outline" className="text-white border-white/30 px-3 py-1 text-lg">{result.score}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black pt-20 pb-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white mb-2">Hiramani Chauhan Learning Institute</h2>
            </div>
            <div className="flex gap-6">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <p>&copy; 2024 Hiramani Chauhan Learning Institute. All rights reserved.</p>
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
