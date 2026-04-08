import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ShieldAlert, Save, Pencil, X, KeyRound, Loader2, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchTerms, updateTerms, requestTermsUpdateOtp } from "@/api/portalApi";
import { toast } from "sonner";

interface TermsSection {
  id: string;
  heading: string;
  content: string;
}

export const TermsManagement = () => {
  const [sections, setSections] = useState<TermsSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // For tracking which section is being edited inline
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editHeading, setEditHeading] = useState("");
  const [editContent, setEditContent] = useState("");

  // For adding new sections
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [newContent, setNewContent] = useState("");

  // OTP State
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      const data = await fetchTerms();
      // Support both old format (content string) and new format (sections array)
      if (data.sections && Array.isArray(data.sections)) {
        setSections(data.sections);
      } else if (data.content) {
        // Legacy: convert old plain text to a single section
        setSections([{ id: generateId(), heading: "General Terms", content: data.content }]);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error("Failed to load terms:", error);
      toast.error("Failed to load Terms & Conditions");
    }
  };

  const generateId = () => `sect_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // ──── Add Section ────
  const handleAddSection = () => {
    if (!newHeading.trim()) {
      toast.error("Heading is required");
      return;
    }
    if (!newContent.trim()) {
      toast.error("Content is required");
      return;
    }
    const newSection: TermsSection = {
      id: generateId(),
      heading: newHeading.trim(),
      content: newContent.trim(),
    };
    setSections(prev => [...prev, newSection]);
    setNewHeading("");
    setNewContent("");
    setShowAddForm(false);
    toast.success("Section added. Click 'Save Changes' to publish.");
  };

  // ──── Edit Section ────
  const startEditSection = (section: TermsSection) => {
    setEditingSectionId(section.id);
    setEditHeading(section.heading);
    setEditContent(section.content);
  };

  const saveEditSection = () => {
    if (!editHeading.trim()) {
      toast.error("Heading is required");
      return;
    }
    if (!editContent.trim()) {
      toast.error("Content is required");
      return;
    }
    setSections(prev =>
      prev.map(s =>
        s.id === editingSectionId
          ? { ...s, heading: editHeading.trim(), content: editContent.trim() }
          : s
      )
    );
    setEditingSectionId(null);
    setEditHeading("");
    setEditContent("");
    toast.success("Section updated. Click 'Save Changes' to publish.");
  };

  const cancelEditSection = () => {
    setEditingSectionId(null);
    setEditHeading("");
    setEditContent("");
  };

  // ──── Delete Section ────
  const confirmDeleteSection = (id: string) => {
    setDeleteSectionId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSection = () => {
    if (!deleteSectionId) return;
    setSections(prev => prev.filter(s => s.id !== deleteSectionId));
    setDeleteDialogOpen(false);
    setDeleteSectionId(null);
    toast.success("Section removed. Click 'Save Changes' to publish.");
  };

  // ──── Reorder Sections ────
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  // ──── Save Flow (with OTP) ────
  const handleSaveInit = async () => {
    setLoading(true);
    try {
      await requestTermsUpdateOtp();
      setOtpDialogOpen(true);
      toast.info("OTP sent to Super Admin email.");
    } catch (error) {
      console.error("Failed to request OTP:", error);
      toast.error("Failed to initiate save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSave = async () => {
    if (!otpValue || otpValue.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      await updateTerms({ sections }, otpValue);
      toast.success("Terms & Conditions saved successfully!");
      setEditing(false);
      setOtpDialogOpen(false);
      setOtpValue("");
      setEditingSectionId(null);
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Failed to save terms:", error);
      toast.error(error.message || "Invalid OTP or failed to save changes");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditingSectionId(null);
    setShowAddForm(false);
    setNewHeading("");
    setNewContent("");
    loadTerms();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-8 w-8" />
          Terms & Conditions Management
        </h1>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveInit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Requesting OTP..." : "Save Changes"}
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

      {/* Section count */}
      <p className="text-sm text-gray-500">
        {sections.length} section{sections.length !== 1 ? "s" : ""} • Each section is displayed with a <strong>bold heading</strong> followed by its content on the public Terms & Conditions page.
      </p>

      {/* Sections List */}
      {sections.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <ShieldAlert className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No terms & conditions sections yet.</p>
            {editing && (
              <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add First Section
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {sections.map((section, index) => (
        <Card key={section.id} className="relative">
          <CardContent className="pt-6">
            {editingSectionId === section.id ? (
              // ── Inline Edit Mode ──
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Heading</label>
                  <Input
                    value={editHeading}
                    onChange={(e) => setEditHeading(e.target.value)}
                    placeholder="Section heading..."
                    className="font-bold text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Content</label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Section content..."
                    rows={6}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={cancelEditSection}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={saveEditSection}>
                    <Save className="h-4 w-4 mr-1" /> Update
                  </Button>
                </div>
              </div>
            ) : (
              // ── View Mode ──
              <div className="flex gap-4">
                {/* Reorder Buttons (only in edit mode) */}
                {editing && (
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {index + 1}. {section.heading}
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </p>
                </div>

                {/* Action Buttons (only in edit mode) */}
                {editing && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => startEditSection(section)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => confirmDeleteSection(section.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add New Section Form */}
      {editing && showAddForm && (
        <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Section
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Heading *</label>
              <Input
                value={newHeading}
                onChange={(e) => setNewHeading(e.target.value)}
                placeholder="e.g. Privacy Policy, Refund Policy..."
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content *</label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter the content for this section..."
                rows={6}
                className="text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowAddForm(false); setNewHeading(""); setNewContent(""); }}>
                Cancel
              </Button>
              <Button onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-1" /> Add Section
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Section Button */}
      {editing && !showAddForm && sections.length > 0 && (
        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add New Section
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Section
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this section? This action will take effect after you save changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSection}>
              Delete Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <KeyRound className="h-5 w-5" />
              Super Admin Verification
            </DialogTitle>
            <DialogDescription>
              To protect the Terms & Conditions, an OTP has been sent to the Super Admin (hir*****99@gmail.com). Please enter it below to confirm changes.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              className="text-center font-mono text-lg tracking-widest"
              maxLength={6}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOtpDialogOpen(false)} disabled={otpLoading}>
              Cancel
            </Button>
            <Button onClick={verifyAndSave} disabled={otpLoading || otpValue.length < 6} className="bg-amber-600 hover:bg-amber-700 text-white">
              {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {otpLoading ? "Verifying..." : "Verify & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
