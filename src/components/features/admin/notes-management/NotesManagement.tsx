import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Edit, Trash2, Download, Calendar, Search } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

export const NotesManagement = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<any>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<{ id: string; title: string } | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [teacher, setTeacher] = useState("");
  const [fileData, setFileData] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/notes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotes(data || []);
      }
    } catch (error) {
      console.error("Fetch notes error:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (note: any) => {
    setEditingNote(note);
    setTitle(note.title);
    setSubject(note.subject);
    setChapter(note.chapter);
    setTeacher(note.uploadedBy);
    setFileName(note.fileName || "Existing File (Leave empty to keep)"); // Use note.fileName if available
    setFileData(note.fileData || "");
    setFileSize(note.fileSize || "");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingNote(null);
    setTitle("");
    setSubject("");
    setChapter("");
    setTeacher("");
    setFileData("");
    setFileName("");
    setFileSize("");
  };

  const handleUpload = async () => {
    if (!title || !subject || !chapter || (!fileData && !editingNote?.fileData)) { // Check for existing fileData in edit mode
      toast.error("Please fill all required fields and select a file");
      return;
    }

    setUploading(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
      const method = editingNote ? 'PUT' : 'POST';

      const payload: any = {
        title,
        subject,
        chapter,
        uploadedBy: teacher || "Admin"
      };

      // Only include file data if a new file is selected or if it's a new upload
      if (fileData && (fileData !== editingNote?.fileData || !editingNote)) {
        payload.fileData = fileData;
        payload.fileSize = fileSize;
        payload.fileType = fileName.split('.').pop()?.toUpperCase() || "PDF";
        payload.fileName = fileName; // Store fileName
      } else if (editingNote && !fileData && editingNote.fileData) {
        // If in edit mode and no new file is selected, retain existing file info
        payload.fileData = editingNote.fileData;
        payload.fileSize = editingNote.fileSize;
        payload.fileType = editingNote.fileType;
        payload.fileName = editingNote.fileName;
      }


      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`Note ${editingNote ? 'updated' : 'uploaded'} successfully`);
        closeDialog();
        fetchNotes();
      } else {
        toast.error(`Failed to ${editingNote ? 'update' : 'upload'} note`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Network error");
    } finally {
      setUploading(false);
    }
  };

  const requestDeleteNote = (note: any) => {
    setPendingDeleteNote({ id: note.id, title: note.title });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Note deleted");
        setNotes(notes.filter(n => n.id !== id));
      } else {
        toast.error("Failed to delete note");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Network error");
    }
  };

  const handleDownload = async (note: any) => {
    if (note.fileData) {
      const link = document.createElement('a');
      link.href = note.fileData;
      link.download = `${note.title.replace(/\s+/g, '_')}.${note.fileType.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment downloads
      try {
        const token = sessionStorage.getItem('token');
        await fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...note, downloads: (note.downloads || 0) + 1 })
        });
        fetchNotes(); // Silently refresh to update download count
      } catch (e) {
        console.error("Failed to update download count", e);
      }
    } else {
      toast.error("File data missing");
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n =>
      (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.chapter || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Notes Management</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notes..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) closeDialog();
            else setIsDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingNote(null)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingNote ? "Edit Study Note" : "Upload New Study Note"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <Input placeholder="Note Title" value={title} onChange={e => setTitle(e.target.value)} />
                  <Input
                    placeholder="Subject (e.g. Mathematics, Physics)"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    list="subject-options"
                  />
                  <datalist id="subject-options">
                    <option value="Mathematics" />
                    <option value="Physics" />
                    <option value="Reasoning" />
                    <option value="Chemistry" />
                    <option value="Computer" />
                    <option value="General Studies" />
                  </datalist>
                  <Input placeholder="Chapter Name" value={chapter} onChange={e => setChapter(e.target.value)} />
                  <Input placeholder="Teacher Name" value={teacher} onChange={e => setTeacher(e.target.value)} />
                </div>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                  />
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    {fileName ? fileName : "Click to browse a new file"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">PDF, DOC, PPT max 10MB</p>
                </div>
                <Button className="w-full" onClick={handleUpload} disabled={uploading}>
                  {uploading ? "Saving..." : editingNote ? "Update Note" : "Upload Note"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Uploaded Notes</CardTitle>
            {/* Action Toolbar */}
            <div className="flex items-center gap-2">
              {selectedNoteId && (
                <span className="text-sm text-indigo-600 font-medium mr-2">
                  Selected: {notes.find(n => n.id === selectedNoteId)?.title}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedNoteId}
                onClick={() => {
                  const note = notes.find(n => n.id === selectedNoteId);
                  if (note) handleDownload(note);
                }}
                className={!selectedNoteId ? "opacity-50" : ""}
              >
                <Download size={14} className="mr-1" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedNoteId}
                onClick={() => {
                  const note = notes.find(n => n.id === selectedNoteId);
                  if (note) openEditModal(note);
                }}
                className={`text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 ${!selectedNoteId ? "opacity-50" : ""}`}
              >
                <Edit size={14} className="mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!selectedNoteId}
                onClick={() => {
                  const note = notes.find(n => n.id === selectedNoteId);
                  if (note) requestDeleteNote(note);
                }}
                className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${!selectedNoteId ? "opacity-50" : ""}`}
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center p-4 text-gray-500">Loading notes...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-center p-4 text-gray-500">No notes found.</p>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                    selectedNoteId === note.id
                      ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-200"
                      : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
                  onClick={() => setSelectedNoteId(selectedNoteId === note.id ? null : note.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-8 w-8 text-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{note.title}</h3>
                          {selectedNoteId === note.id && (
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Selected</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline">{note.subject}</Badge>
                          <Badge variant="secondary">{note.chapter}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {note.uploadDate}
                          </span>
                          <span>{note.fileSize}</span>
                          <span>{note.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

    {/* Delete Confirmation Dialog */}
    <DeleteConfirmDialog
      open={deleteConfirmOpen}
      onOpenChange={(val) => { setDeleteConfirmOpen(val); if (!val) setPendingDeleteNote(null); }}
      itemName={pendingDeleteNote?.title || ""}
      itemType="note"
      onConfirm={() => {
        if (pendingDeleteNote) handleDelete(pendingDeleteNote.id);
      }}
    />
  </div>
  );
};
