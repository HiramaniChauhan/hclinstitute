import { useEffect, useState } from 'react';
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, CheckCircle, User, MapPin, GraduationCap, Phone, Loader2, Camera, Upload } from "lucide-react";

export const Profile = () => {
  const { getProfile, updateProfile } = useAuth();
  const [studentData, setStudentData] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log("[Profile] Fetching profile...");
      try {
        const data = await getProfile();
        console.log("[Profile] Received data:", data);
        if (data) {
          setStudentData(data);
          setEditForm(data);
        } else {
          console.error("[Profile] No data received from getProfile");
        }
      } catch (error) {
        console.error("[Profile] Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [getProfile]);

  const handleSave = async () => {
    console.log("[Profile] Saving changes:", editForm);
    const success = await updateProfile(editForm);
    if (success) {
      setStudentData(editForm);
      setIsEditing(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpdate = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
        <User className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 text-lg">Could not load your profile data.</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry Loading</Button>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button
          variant={isEditing ? "destructive" : "outline"}
          onClick={() => {
            if (isEditing) setEditForm(studentData);
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-2"
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={editForm.profileImage || "https://github.com/shadcn.png"} />
                <AvatarFallback>{studentData.firstName?.[0]}{studentData.lastName?.[0]}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Change</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{studentData.firstName} {studentData.lastName}</h2>
              <p className="text-gray-600">{studentData.email}</p>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Contact Info */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Personal & Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-medium">{studentData.firstName} {studentData.lastName}</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-medium">{studentData.gender}</p>
              </div>
              <div>
                <p className="text-gray-500">Date of Birth</p>
                <p className="font-medium">{studentData.dateOfBirth || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Mobile</p>
                <p className="font-medium">{studentData.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{studentData.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Aadhar Number</p>
                <p className="font-medium">{studentData.aadharNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Father's Name</p>
                {isEditing ? (
                  <Input
                    value={editForm.fatherName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                    className="h-8 mt-1"
                  />
                ) : (
                  <p className="font-medium">{studentData.fatherName || 'N/A'}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">Mother's Name</p>
                {isEditing ? (
                  <Input
                    value={editForm.motherName || ''}
                    onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                    className="h-8 mt-1"
                  />
                ) : (
                  <p className="font-medium">{studentData.motherName || 'N/A'}</p>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
              </div>
            )}
            <div className="pt-4 border-t">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-500 text-xs uppercase font-semibold">Address</p>
                  <p className="text-sm font-medium">
                    {studentData.address || 'N/A'}<br />
                    {studentData.city || ''}, {studentData.state || ''} - {studentData.pincode || ''}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic & Documents */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" /> Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Highest Qualification</p>
                  <p className="font-medium">{studentData.qualification}</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Institute</p>
                  <p className="font-medium">{studentData.institute}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Account Verification</span>
                {studentData.isVerified ?
                  <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge> :
                  <Badge variant="outline" className="text-gray-500 italic">Pending Manual Verification</Badge>
                }
              </div>

              {/* 10th Marksheet Section */}
              <div className="space-y-2 p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">10th Marksheet (Result)</span>
                  {editForm?.marksheet10th || studentData.marksheet10th ?
                    <Badge variant="default" className="bg-green-600 font-normal"><CheckCircle className="w-3 h-3 mr-1" /> Uploaded</Badge> :
                    <Badge variant="outline" className="text-gray-400 font-normal">Not Uploaded</Badge>
                  }
                </div>
                {(studentData.marksheet10th || editForm?.marksheet10th) && (
                  <div className="mt-2 text-center border rounded-md p-1 bg-white">
                    <img
                      src={editForm?.marksheet10th || studentData.marksheet10th}
                      alt="10th Marksheet"
                      className="max-h-32 mx-auto rounded object-contain"
                    />
                  </div>
                )}
                {isEditing && !studentData.isVerified && (
                  <div className="mt-2 space-y-2">
                    <Label className="text-xs text-blue-600 cursor-pointer block hover:underline">
                      {editForm?.marksheet10th || studentData.marksheet10th ? "Change Marksheet" : "Upload 10th Marksheet"}
                      <Input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpdate(e, 'marksheet10th')}
                      />
                    </Label>
                    <p className="text-[10px] text-gray-400">Accepted formats: JPG, PNG, PDF</p>
                  </div>
                )}
              </div>

              {/* Aadhar Photo Section */}
              <div className="space-y-2 p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Aadhar Card Photo</span>
                  {editForm?.aadharPhoto || studentData.aadharPhoto ?
                    <Badge variant="default" className="bg-green-600 font-normal"><CheckCircle className="w-3 h-3 mr-1" /> Uploaded</Badge> :
                    <Badge variant="outline" className="text-gray-400 font-normal">No Photo</Badge>
                  }
                </div>
                {(studentData.aadharPhoto || editForm?.aadharPhoto) && (
                  <div className="mt-2 text-center border rounded-md p-1 bg-white">
                    <img
                      src={editForm?.aadharPhoto || studentData.aadharPhoto}
                      alt="Aadhar Photo"
                      className="max-h-32 mx-auto rounded object-contain"
                    />
                  </div>
                )}
                {isEditing && !studentData.isVerified && (
                  <div className="mt-2 space-y-2">
                    <Label className="text-xs text-blue-600 cursor-pointer block hover:underline">
                      {editForm?.aadharPhoto || studentData.aadharPhoto ? "Change Aadhar Photo" : "Upload Aadhar Photo"}
                      <Input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileUpdate(e, 'aadharPhoto')}
                      />
                    </Label>
                    <p className="text-[10px] text-gray-400">Accepted formats: JPG, PNG</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
};
