
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Info, Save, Upload, User, Mail, Phone, Linkedin, Instagram } from "lucide-react";

export const AboutManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Info className="h-8 w-8" />
          About Section Management
        </h1>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Director Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Director & Founder Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input placeholder="Full Name" defaultValue="Hiramani Chauhan" />
              <Input placeholder="Designation" defaultValue="Director & Founder" />
              <Input placeholder="Qualification" defaultValue="M.Tech, Ph.D" />
              <Input placeholder="Experience" defaultValue="15+ Years" />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Upload Director Photo</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG files only</p>
              </div>
            </div>
            <div className="space-y-4">
              <Textarea 
                placeholder="About Director" 
                rows={6}
                defaultValue="Hiramani Chauhan is a visionary educator and founder of HCL Institute. With over 15 years of experience in mathematics and competitive exam preparation, he has guided thousands of students to achieve their dreams."
              />
              <Textarea 
                placeholder="Vision & Mission" 
                rows={4}
                defaultValue="To provide quality education and create future leaders through innovative teaching methodologies and personalized attention."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <Input placeholder="Email Address" defaultValue="director@hclinstitute.com" />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <Input placeholder="Mobile Number" defaultValue="+91 98765 43210" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-gray-500" />
              <Input placeholder="LinkedIn Profile" defaultValue="linkedin.com/in/hiramani-chauhan" />
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-gray-500" />
              <Input placeholder="Instagram Handle" defaultValue="@hclinstitute_official" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institute Information */}
      <Card>
        <CardHeader>
          <CardTitle>Institute Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Institute Name" defaultValue="HCL Institute" />
          <Input placeholder="Established Year" defaultValue="2008" />
          <Textarea 
            placeholder="Institute Description" 
            rows={4}
            defaultValue="HCL Institute is a premier coaching center dedicated to providing excellent education in Mathematics, Reasoning, and Computer Science. We focus on competitive exam preparation and overall personality development."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Address" defaultValue="123 Education Street, Learning City" />
            <Input placeholder="Pin Code" defaultValue="123456" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="City" defaultValue="Learning City" />
            <Input placeholder="State" defaultValue="Education State" />
          </div>
        </CardContent>
      </Card>

      {/* Achievements & Recognition */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements & Recognition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="Institute Achievements" 
            rows={4}
            defaultValue="• 1000+ successful students placed in top companies
• 95% success rate in competitive exams
• Winner of 'Best Coaching Institute' award 2023
• Featured in leading education magazines"
          />
          <Textarea 
            placeholder="Director Achievements" 
            rows={4}
            defaultValue="• Author of 5 mathematics textbooks
• Guest speaker at national education conferences
• Received 'Excellence in Education' award
• 15+ years of teaching experience"
          />
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Institute Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Upload Institute Logo</p>
            <p className="text-sm text-gray-500 mt-1">PNG files preferred, transparent background</p>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        Save All Changes
      </Button>
    </div>
  );
};
