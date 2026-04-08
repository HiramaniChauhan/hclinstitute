
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Info, Save, Upload, User, Mail, Phone, Linkedin, Instagram, Plus, Trash2, Link as LinkIcon, Pencil, X, AlertTriangle } from "lucide-react";
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
    additionalLinks: [],
    siteNotices: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingNotice, setEditingNotice] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(false);
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
      setEditing(false);
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

  const handleCancelEdit = () => {
    setEditing(false);
    // Reload data to discard unsaved changes
    loadAboutInfo();
  };

  const handleSaveNotice = async () => {
    setNoticeLoading(true);
    try {
      await updateAboutInfo({ ...aboutData });
      toast.success("Site notice updated successfully!");
      setEditingNotice(false);
    } catch (error) {
      console.error("Failed to save site notice:", error);
      toast.error("Failed to save site notice");
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleCancelNotice = () => {
    setEditingNotice(false);
    loadAboutInfo();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Info className="h-8 w-8" />
          About Section Management
        </h1>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Site Notice / Student Alert Banner — Independent Edit */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Site Notice for Students
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">This message will appear as a banner on the home page. Leave empty to hide it.</p>
            </div>
            <div className="flex items-center gap-2">
              {editingNotice ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelNotice} disabled={noticeLoading}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveNotice} disabled={noticeLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Save className="h-4 w-4 mr-1" /> {noticeLoading ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditingNotice(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(aboutData.siteNotices || []).length === 0 && !editingNotice && (
            <p className="text-sm text-gray-500 text-center py-4">No active notices. Click Edit to add one.</p>
          )}
          {(aboutData.siteNotices || []).map((notice: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex items-center justify-center h-9 w-9 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <Input
                placeholder="Enter notice message..."
                value={notice}
                onChange={(e) => {
                  const updated = [...(aboutData.siteNotices || [])];
                  updated[index] = e.target.value;
                  setAboutData((prev: any) => ({ ...prev, siteNotices: updated }));
                }}
                disabled={!editingNotice}
                className={`flex-1 ${!editingNotice ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
              {editingNotice && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  onClick={() => {
                    const updated = [...(aboutData.siteNotices || [])];
                    updated.splice(index, 1);
                    setAboutData((prev: any) => ({ ...prev, siteNotices: updated }));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {editingNotice && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setAboutData((prev: any) => ({
                  ...prev,
                  siteNotices: [...(prev.siteNotices || []), ""]
                }));
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Notice
            </Button>
          )}
          {(aboutData.siteNotices || []).filter((n: string) => n.trim()).length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <p className="font-semibold mb-2">Preview (scrolling ticker):</p>
              <div className="overflow-hidden w-full">
                <div className="animate-marquee-preview whitespace-nowrap inline-block w-max">
                  {(aboutData.siteNotices || []).filter((n: string) => n.trim()).map((n: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 mx-12">
                      ⚠️ {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              <Input placeholder="Full Name" name="directorName" value={aboutData.directorName} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />
              <Input placeholder="Qualification" name="directorQualification" value={aboutData.directorQualification} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />

              <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative overflow-hidden group ${!editing ? 'opacity-70 pointer-events-none' : ''}`}>
                <input
                  type="file"
                  accept="image/jpeg, image/png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => handleFileChange(e, 'directorPhoto')}
                  disabled={!editing}
                />
                {aboutData.directorPhoto ? (
                  <div className="relative h-32 w-full">
                    <img src={aboutData.directorPhoto} alt="Director Preview" className="h-full w-full object-contain" />
                    {editing && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <Upload className="h-6 w-6 mb-1" />
                        <span className="text-sm">Change Photo</span>
                      </div>
                    )}
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
                disabled={!editing}
                className={!editing ? "bg-gray-50 cursor-not-allowed" : ""}
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
              <Input placeholder="Email Address" name="contactEmail" value={aboutData.contactEmail} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <Input placeholder="Mobile Number" name="contactPhone" value={aboutData.contactPhone} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-gray-500" />
              <Input placeholder="LinkedIn Profile" name="contactLinkedin" value={aboutData.contactLinkedin} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-gray-500" />
              <Input placeholder="Instagram Handle" name="contactInstagram" value={aboutData.contactInstagram} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold">Additional Links (YouTube, Facebook, Twitter, etc.)</h3>
              {editing && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
                  <Plus className="h-4 w-4 mr-1" /> Add Link
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {(aboutData.additionalLinks || []).map((link: any, index: number) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      placeholder="e.g. YouTube"
                      value={link.title}
                      onChange={(e) => handleLinkChange(index, 'title', e.target.value)}
                      disabled={!editing}
                      className={!editing ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                    <Input
                      placeholder="https://"
                      value={link.url}
                      onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                      disabled={!editing}
                      className={!editing ? "bg-gray-50 cursor-not-allowed" : ""}
                    />
                  </div>
                  {editing && (
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveLink(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
          <Input placeholder="Institute Name" name="instituteName" value={aboutData.instituteName} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />
          <Input placeholder="Established Year" name="establishedYear" value={aboutData.establishedYear} onChange={handleChange} disabled={!editing} className={!editing ? "bg-gray-50 cursor-not-allowed" : ""} />
          <Textarea
            placeholder="Institute Description"
            rows={4}
            name="instituteDescription"
            value={aboutData.instituteDescription}
            onChange={handleChange}
            disabled={!editing}
            className={!editing ? "bg-gray-50 cursor-not-allowed" : ""}
          />
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Institute Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative overflow-hidden group ${!editing ? 'opacity-70 pointer-events-none' : ''}`}>
            <input
              type="file"
              accept="image/png, image/jpeg"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => handleFileChange(e, 'instituteLogo')}
              disabled={!editing}
            />
            {aboutData.instituteLogo ? (
              <div className="relative h-32 w-full">
                <img src={aboutData.instituteLogo} alt="Institute Logo Preview" className="h-full w-full object-contain" />
                {editing && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-sm">Change Logo</span>
                  </div>
                )}
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

      {editing && (
        <Button className="w-full" size="lg" onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving All Changes..." : "Save All Changes"}
        </Button>
      )}

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
