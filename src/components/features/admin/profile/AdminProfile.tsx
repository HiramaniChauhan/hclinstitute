import { useEffect, useState } from 'react';
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MapPin, Phone, Loader2, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";

export const AdminProfile = () => {
    const { getProfile, updateProfile } = useAuth();
    const [adminData, setAdminData] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                if (data) {
                    setAdminData(data);
                    setEditForm(data);
                }
            } catch (error) {
                console.error("Error fetching admin profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [getProfile]);

    const handleSave = async () => {
        try {
            const success = await updateProfile(editForm);
            if (success) {
                setAdminData(editForm);
                setIsEditing(false);
                toast.success("Profile updated successfully");
            } else {
                toast.error("Failed to update profile");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    if (!adminData) {
        return (
            <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
                <ShieldCheck className="w-16 h-16 text-gray-300" />
                <p className="text-gray-500 text-lg">Could not load admin profile data.</p>
                <Button onClick={() => window.location.reload()} variant="outline">Retry Loading</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <ShieldCheck className="text-red-600 w-8 h-8" />
                        Admin Profile
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your administrative account details</p>
                </div>
                <Button
                    variant={isEditing ? "destructive" : "outline"}
                    onClick={() => {
                        if (isEditing) setEditForm(adminData);
                        setIsEditing(!isEditing);
                    }}
                    className="flex items-center gap-2"
                >
                    {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
            </div>

            {/* Profile Header */}
            <Card className="border-t-4 border-t-red-600">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                                <AvatarImage src={editForm?.profileImage || "https://github.com/shadcn.png"} />
                                <AvatarFallback className="text-3xl bg-red-50 text-red-600 font-bold">
                                    {adminData.firstName?.[0] || ''}{adminData.lastName?.[0] || adminData.name?.[0] || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-sm font-medium">Change Photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h2 className="text-3xl font-bold text-gray-900">
                                {adminData.firstName && adminData.lastName
                                    ? `${adminData.firstName} ${adminData.lastName}`
                                    : adminData.name}
                            </h2>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{adminData.email}</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                <Badge variant="default" className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1">Administrator</Badge>
                                <Badge variant="outline" className="text-sm px-3 py-1 border-gray-300">
                                    {adminData.role || 'Admin'}
                                </Badge>
                                {adminData.isVerified && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                        Verified Account
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Admin Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal & Contact Info */}
                <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="w-5 h-5 text-blue-600" /> Personal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-1.5">
                                <p className="text-gray-500 font-medium">First Name</p>
                                <Input
                                    value={adminData.firstName || adminData.name?.split(' ')[0] || ''}
                                    disabled
                                    className="bg-gray-100 text-gray-700 cursor-not-allowed border-gray-200"
                                />
                                <p className="text-xs text-red-500 mt-1">Name cannot be changed</p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-gray-500 font-medium">Last Name</p>
                                <Input
                                    value={adminData.lastName || adminData.name?.split(' ').slice(1).join(' ') || ''}
                                    disabled
                                    className="bg-gray-100 text-gray-700 cursor-not-allowed border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                                <p className="text-gray-500 font-medium">Email Address</p>
                                <Input
                                    value={adminData.email || ''}
                                    disabled
                                    className="bg-gray-100 text-gray-700 cursor-not-allowed border-gray-200"
                                />
                                <p className="text-xs text-red-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-gray-500 font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Mobile Number
                                </p>
                                {isEditing ? (
                                    <Input
                                        value={editForm.phone || ''}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="border-blue-200 focus-visible:ring-blue-600"
                                        placeholder="Enter mobile number"
                                    />
                                ) : (
                                    <p className="font-medium text-gray-900 border border-transparent p-2 pl-0">
                                        {adminData.phone || 'Not provided'}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-gray-500 font-medium">Gender</p>
                                {isEditing ? (
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-blue-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={editForm.gender || ''}
                                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <p className="font-medium text-gray-900 border border-transparent p-2 pl-0">
                                        {adminData.gender || 'Not specified'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address Info */}
                <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="w-5 h-5 text-green-600" /> Location Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4 text-sm">
                            <div className="space-y-1.5">
                                <p className="text-gray-500 font-medium">Street Address</p>
                                {isEditing ? (
                                    <Input
                                        value={editForm.address || ''}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="border-green-200 focus-visible:ring-green-600"
                                        placeholder="Enter full address"
                                    />
                                ) : (
                                    <p className="font-medium text-gray-900 border border-transparent py-2">
                                        {adminData.address || 'Not provided'}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <p className="text-gray-500 font-medium">City</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.city || ''}
                                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                            className="border-green-200 focus-visible:ring-green-600"
                                            placeholder="City"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900 border border-transparent py-2">
                                            {adminData.city || 'N/A'}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-gray-500 font-medium">State</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.state || ''}
                                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                            className="border-green-200 focus-visible:ring-green-600"
                                            placeholder="State"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900 border border-transparent py-2">
                                            {adminData.state || 'N/A'}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-gray-500 font-medium">Pincode</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.pincode || ''}
                                            onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                                            className="border-green-200 focus-visible:ring-green-600"
                                            placeholder="Postal Code"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-900 border border-transparent py-2">
                                            {adminData.pincode || 'N/A'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="pt-6 flex justify-end border-t mt-4">
                                <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto px-8">
                                    Save Profile Changes
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
