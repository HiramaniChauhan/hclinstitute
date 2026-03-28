import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, GraduationCap, Phone, Loader2, ArrowLeft, Camera, ShieldCheck, ShieldAlert, FileText, CheckCircle, Upload, BookOpen, XCircle, ChevronRight, BarChart2, Clock } from "lucide-react";
import { fetchStudentProfile, updateStudentProfile, fetchStudentResults, fetchTestById } from "@/api/portalApi";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropDialog } from "../course-management/ImageCropDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TestInterface } from "../../tests/TestInterface";

interface StudentDetailProps {
    studentId: string;
    onBack: () => void;
}

export const StudentDetail = ({ studentId, onBack }: StudentDetailProps) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [student, setStudent] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const { toast } = useToast();
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [rawImageSrc, setRawImageSrc] = useState("");

    // Test History state
    const [testResults, setTestResults] = useState<any[]>([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [reviewData, setReviewData] = useState<{ result: any; test: any; allAttempts: any[]; initialAttemptIdx: number } | null>(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const [testNames, setTestNames] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadStudent = async () => {
            try {
                const data = await fetchStudentProfile(studentId);
                setStudent(data);
                if (data.name && !data.firstName && !data.lastName) {
                    const parts = data.name.split(' ');
                    data.firstName = parts[0];
                    data.lastName = parts.slice(1).join(' ');
                }
                setFormData(data);
            } catch (error: any) {
                toast({ title: "Error loading student", description: error.message, variant: "destructive" });
                onBack();
            } finally {
                setLoading(false);
            }
        };
        loadStudent();

        // Load test results
        const loadResults = async () => {
            setLoadingResults(true);
            try {
                const results = await fetchStudentResults(studentId);
                const sorted = (results || []).sort((a: any, b: any) =>
                    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                );
                // Fetch test titles for display
                const uniqueIds = [...new Set(sorted.map((r: any) => r.testId))] as string[];
                const names: Record<string, string> = {};
                const validTestIds = new Set<string>();

                await Promise.all(
                    uniqueIds.map(async (id) => {
                        try {
                            const test = await fetchTestById(id);
                            if (test?.title) {
                                names[id] = test.title;
                                validTestIds.add(String(id));
                            }
                        } catch {
                            // assume deleted or inaccessible
                        }
                    })
                );

                const activeResults = sorted.filter((r: any) => validTestIds.has(String(r.testId)));
                setTestResults(activeResults);
                setTestNames(names);
            } catch {
                // silently fail — test history is supplementary
            } finally {
                setLoadingResults(false);
            }
        };
        loadResults();
    }, [studentId, toast, onBack]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpdate = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'profileImage') {
                    setRawImageSrc(reader.result as string);
                    setCropDialogOpen(true);
                } else {
                    setFormData({ ...formData, [field]: reader.result as string });
                }
            };
            reader.readAsDataURL(file);
            e.target.value = "";
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedData = { ...formData };
            if (updatedData.firstName || updatedData.lastName) {
                updatedData.name = `${updatedData.firstName || student.firstName || ''} ${updatedData.lastName || student.lastName || ''}`.trim();
            }

            const updated = await updateStudentProfile(studentId, updatedData);
            setStudent(updated);
            setFormData(updated);
            toast({ title: "Student profile updated successfully" });
        } catch (error: any) {
            toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleReviewTest = async (result: any) => {
        setLoadingReview(true);
        try {
            const test = await fetchTestById(result.testId);

            // Find all attempts for this specific test
            const allAttempts = testResults
                .filter((r) => String(r.testId) === String(result.testId))
                .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

            const initialAttemptIdx = allAttempts.findIndex((r) => r.resultId === result.resultId);

            setReviewData({
                result,
                test,
                allAttempts,
                initialAttemptIdx: initialAttemptIdx >= 0 ? initialAttemptIdx : 0
            });
        } catch {
            toast({ title: "Failed to load test details", variant: "destructive" } as any);
        } finally {
            setLoadingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-gray-500">Loading student details...</p>
            </div>
        );
    }

    if (!student) return null;

    if (reviewData) {
        return (
            <TestInterface
                test={reviewData.test}
                onComplete={() => { }} // No action needed on complete in review mode
                onCancel={() => setReviewData(null)}
                reviewMode={true}
                answers={reviewData.result.userAnswers}
                allAttempts={reviewData.allAttempts}
                initialAttemptIdx={reviewData.initialAttemptIdx}
            />
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden shadow-inner shrink-0">
                        {formData.profileImage ? (
                            <img src={formData.profileImage} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            student.firstName?.charAt(0).toUpperCase() || student.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold flex items-center gap-2 truncate">
                            {student.firstName || student.lastName ? `${student.firstName} ${student.lastName}` : student.name}
                            {student.isVerified && <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">Student ID: <span className="font-mono text-gray-700">{student.id}</span></p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onBack}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="w-5 h-5 text-indigo-500" /> Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start mb-6 pb-6 border-b border-gray-100">
                                <div className="flex flex-col justify-center w-full md:w-auto relative group">
                                    <Avatar className="h-28 w-28 ring-4 ring-white shadow-lg mx-auto md:mx-0">
                                        <AvatarImage src={formData.profileImage} />
                                        <AvatarFallback className="text-3xl bg-indigo-50 text-indigo-600">
                                            {formData.firstName?.charAt(0) || formData.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Label className="absolute bottom-0 right-0 md:left-20 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition shadow-md">
                                        <Camera className="w-4 h-4" />
                                        <Input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpdate(e, 'profileImage')}
                                        />
                                    </Label>
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Email (Read-only)</Label>
                                    <Input value={student.email} disabled className="bg-gray-50 border-gray-200 text-gray-600 font-medium" />
                                    <p className="text-xs text-amber-600 flex items-center mt-1">
                                        <ShieldAlert className="w-3 h-3 mr-1" /> Email cannot be changed for security reasons.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+91" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select value={formData.gender || ''} onValueChange={(val) => handleSelectChange('gender', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Bio / About</Label>
                                    <Textarea
                                        name="bio"
                                        value={formData.bio || ''}
                                        onChange={handleChange}
                                        placeholder="Brief description about the student"
                                        className="h-20 resize-none"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic & Family Info */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <GraduationCap className="w-5 h-5 text-indigo-500" /> Academic & Family Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Academic grid */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Academic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Highest Qualification</Label>
                                        <Input name="qualification" value={formData.qualification || ''} onChange={handleChange} placeholder="e.g. B.Tech, 12th" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Institute / School</Label>
                                        <Input name="institute" value={formData.institute || ''} onChange={handleChange} placeholder="Institute Name" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <Input name="department" value={formData.department || ''} onChange={handleChange} placeholder="e.g. Computer Science" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Semester / Year</Label>
                                        <Input type="number" name="semester" value={formData.semester || ''} onChange={handleChange} placeholder="e.g. 5" />
                                    </div>
                                </div>
                            </div>

                            {/* Family grid */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b">Family Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Father's Name</Label>
                                        <Input name="fatherName" value={formData.fatherName || ''} onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mother's Name</Label>
                                        <Input name="motherName" value={formData.motherName || ''} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test History */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart2 className="w-5 h-5 text-indigo-500" /> Test History
                            </CardTitle>
                            <CardDescription>{testResults.length} test attempt{testResults.length !== 1 ? 's' : ''} found</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingResults ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                                </div>
                            ) : testResults.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">No tests taken yet.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {testResults.map((result) => (
                                        <li key={result.resultId} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                                            <div>
                                                <p className="font-semibold text-sm text-gray-800 truncate max-w-xs">{testNames[result.testId] || result.testId}</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(result.submittedAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <Badge className={result.status === 'passed'
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : 'bg-red-100 text-red-700 border-red-200'
                                                    } variant="outline">
                                                        {result.status === 'passed' ? <CheckCircle className="w-3 h-3 mr-1 inline" /> : <XCircle className="w-3 h-3 mr-1 inline" />}
                                                        {result.percentage?.toFixed(0)}%
                                                    </Badge>
                                                    <p className="text-xs text-gray-500 mt-1">{result.correctAnswers}/{result.totalQuestions} correct</p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => handleReviewTest(result)} disabled={loadingReview}>
                                                    {loadingReview ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                                                    Review
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Address & Verification Docs) */}
                <div className="space-y-6">

                    {/* Verification Documents */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden border-2 border-indigo-50">
                        <CardHeader className="bg-indigo-50/30 border-b border-indigo-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg text-indigo-900">
                                <FileText className="w-5 h-5 text-indigo-500" /> Verification Documents
                            </CardTitle>
                            <CardDescription>
                                Override or upload verification documents on behalf of the student.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Aadhar Number</Label>
                                <Input name="aadharNumber" value={formData.aadharNumber || ''} onChange={handleChange} placeholder="12-digit Aadhar" />
                            </div>

                            <div className="space-y-3 pt-3 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Aadhar Card Photo</Label>
                                    {formData.aadharPhoto && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Uploaded</Badge>}
                                </div>
                                {formData.aadharPhoto && (
                                    <div className="border border-gray-200 rounded-md p-1 bg-white relative group">
                                        <img
                                            src={formData.aadharPhoto}
                                            alt="Aadhar Photo"
                                            className="w-full h-32 object-contain rounded bg-gray-50"
                                        />
                                    </div>
                                )}
                                <Label className="flex items-center justify-center w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors">
                                    <Upload className="w-4 h-4 mr-2 text-gray-400" />
                                    {formData.aadharPhoto ? "Replace Aadhar Photo" : "Upload Aadhar Photo"}
                                    <Input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpdate(e, 'aadharPhoto')}
                                    />
                                </Label>
                            </div>

                            <div className="space-y-3 pt-3 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">10th Marksheet</Label>
                                    {formData.marksheet10th && <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Uploaded</Badge>}
                                </div>
                                {formData.marksheet10th && (
                                    <div className="border border-gray-200 rounded-md p-1 bg-white relative">
                                        <img
                                            src={formData.marksheet10th}
                                            alt="10th Marksheet"
                                            className="w-full h-32 object-contain rounded bg-gray-50"
                                        />
                                    </div>
                                )}
                                <Label className="flex items-center justify-center w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors">
                                    <Upload className="w-4 h-4 mr-2 text-gray-400" />
                                    {formData.marksheet10th ? "Replace Marksheet" : "Upload 10th Marksheet"}
                                    <Input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleFileUpdate(e, 'marksheet10th')}
                                    />
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Info */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <MapPin className="w-5 h-5 text-indigo-500" /> Contact Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Label>Street Address</Label>
                                <Textarea name="address" value={formData.address || ''} onChange={handleChange} className="resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input name="city" value={formData.city || ''} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input name="state" value={formData.state || ''} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Pincode / ZIP</Label>
                                <Input name="pincode" value={formData.pincode || ''} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>

            <ImageCropDialog
                open={cropDialogOpen}
                imageSrc={rawImageSrc}
                aspectRatio={1}
                onClose={() => setCropDialogOpen(false)}
                onCropDone={(cropped) => setFormData({ ...formData, profileImage: cropped })}
            />

            {/* Test Review Modal removed, using TestInterface directly instead */}
        </div>
    );
};
