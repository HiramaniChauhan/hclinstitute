
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Info, Save, Upload, User, Mail, Phone, Linkedin, Instagram, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { useState, useEffect, ChangeEvent } from "react";
import { fetchAboutInfo, updateAboutInfo } from "@/api/portalApi";
import { toast } from "sonner";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/utils/cropImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const AboutManagement = () => {
  const [aboutData, setAboutData] = useState<any>({
    directorName: "",
    directorDesignation: "",
    directorQualification: "",
    directorExperience: "",
    directorBio: "",
    visionMission: "",
    contactEmail: "",
    contactPhone: "",
    contactLinkedin: "",
    contactInstagram: "",
    instituteName: "",
    establishedYear: "",
    instituteDescription: "",
    address: "",
    pinCode: "",
    city: "",
    state: "",
    instituteAchievements: "",
    directorAchievements: "",
    additionalLinks: []
  });
  const [loading, setLoading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'directorPhoto' | 'instituteLogo' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    loadAboutInfo();
  }, []);

  const loadAboutInfo = async () => {
    try {
      const data = await fetchAboutInfo();
      if (Object.keys(data).length > 0) {
        setAboutData((prev: any) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Failed to load about info:", error);
      toast.error("Failed to load About Management data");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateAboutInfo(aboutData);
      toast.success("About Management data saved successfully!");
    } catch (error) {
      console.error("Failed to save about info:", error);
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAboutData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAddLink = () => {
    setAboutData((prev: any) => ({
      ...prev,
      additionalLinks: [...(prev.additionalLinks || []), { title: "", url: "" }]
    }));
  };

  const handleLinkChange = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...(aboutData.additionalLinks || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setAboutData((prev: any) => ({ ...prev, additionalLinks: newLinks }));
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...(aboutData.additionalLinks || [])];
    newLinks.splice(index, 1);
    setAboutData((prev: any) => ({ ...prev, additionalLinks: newLinks }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldName: 'directorPhoto' | 'instituteLogo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCropTarget(fieldName);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        // Clear input so same file can be selected again
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (imageToCrop && croppedAreaPixels && cropTarget) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setAboutData((prev: any) => ({ ...prev, [cropTarget]: croppedImage }));
        setImageToCrop(null);
        setCropTarget(null);
      } catch (e) {
        console.error("Failed to crop image:", e);
        toast.error("Failed to crop image");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Info className="h-8 w-8" />
          About Section Management
        </h1>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
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
              <Input placeholder="Full Name" name="directorName" value={aboutData.directorName} onChange={handleChange} />
              <Input placeholder="Designation" name="directorDesignation" value={aboutData.directorDesignation} onChange={handleChange} />
              <Input placeholder="Qualification" name="directorQualification" value={aboutData.directorQualification} onChange={handleChange} />
              <Input placeholder="Experience" name="directorExperience" value={aboutData.directorExperience} onChange={handleChange} />

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative overflow-hidden group">
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileChange(e, 'directorPhoto')}
                />
                {aboutData.directorPhoto ? (
                  <div className="relative h-32 w-full">
                    <img src={aboutData.directorPhoto} alt="Director Preview" className="h-full w-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-sm">Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Upload Director Photo</p>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG files only</p>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Textarea
                placeholder="About Director"
                rows={6}
                name="directorBio"
                value={aboutData.directorBio}
                onChange={handleChange}
              />
              <Textarea
                placeholder="Vision & Mission"
                rows={4}
                name="visionMission"
                value={aboutData.visionMission}
                onChange={handleChange}
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
              <Input placeholder="Email Address" name="contactEmail" value={aboutData.contactEmail} onChange={handleChange} />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <Input placeholder="Mobile Number" name="contactPhone" value={aboutData.contactPhone} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-gray-500" />
              <Input placeholder="LinkedIn Profile" name="contactLinkedin" value={aboutData.contactLinkedin} onChange={handleChange} />
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-gray-500" />
              <Input placeholder="Instagram Handle" name="contactInstagram" value={aboutData.contactInstagram} onChange={handleChange} />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold">Additional Links (YouTube, Facebook, Twitter, etc.)</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
                <Plus className="h-4 w-4 mr-1" /> Add Link
              </Button>
            </div>
            <div className="space-y-3">
              {(aboutData.additionalLinks || []).map((link: any, index: number) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      placeholder="e.g. YouTube"
                      value={link.title}
                      onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                    />
                    <Input
                      placeholder="https://"
                      value={link.url}
                      onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveLink(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!aboutData.additionalLinks || aboutData.additionalLinks.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-2">No additional links added yet.</p>
              )}
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
          <Input placeholder="Institute Name" name="instituteName" value={aboutData.instituteName} onChange={handleChange} />
          <Input placeholder="Established Year" name="establishedYear" value={aboutData.establishedYear} onChange={handleChange} />
          <Textarea
            placeholder="Institute Description"
            rows={4}
            name="instituteDescription"
            value={aboutData.instituteDescription}
            onChange={handleChange}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Address" name="address" value={aboutData.address} onChange={handleChange} />
            <Input placeholder="Pin Code" name="pinCode" value={aboutData.pinCode} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="City" name="city" value={aboutData.city} onChange={handleChange} />
            <Input placeholder="State" name="state" value={aboutData.state} onChange={handleChange} />
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
            name="instituteAchievements"
            value={aboutData.instituteAchievements}
            onChange={handleChange}
          />
          <Textarea
            placeholder="Director Achievements"
            rows={4}
            name="directorAchievements"
            value={aboutData.directorAchievements}
            onChange={handleChange}
          />
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Institute Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative overflow-hidden group">
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => handleFileChange(e, 'instituteLogo')}
            />
            {aboutData.instituteLogo ? (
              <div className="relative h-32 w-full">
                <img src={aboutData.instituteLogo} alt="Institute Logo Preview" className="h-full w-full object-contain" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-sm">Change Logo</span>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Upload Institute Logo</p>
                <p className="text-sm text-gray-500 mt-1">PNG files preferred, transparent background</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSave} disabled={loading}>
        <Save className="h-4 w-4 mr-2" />
        {loading ? "Saving All Changes..." : "Save All Changes"}
      </Button>

      {/* Crop Modal */}
      <Dialog open={!!imageToCrop} onOpenChange={() => setImageToCrop(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-full bg-black/5 rounded-md overflow-hidden">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="flex items-center gap-4 py-4">
            <span className="text-sm font-medium">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={0.1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full flex-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageToCrop(null)}>Cancel</Button>
            <Button onClick={handleCropSave}>Confirm Crop</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
