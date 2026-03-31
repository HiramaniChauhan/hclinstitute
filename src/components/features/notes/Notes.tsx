import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Search, Filter, FileText, Calendar, X, ShieldAlert } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";

export const Notes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingNote, setViewingNote] = useState<{ title: string; blobUrl: string; isPdf: boolean } | null>(null);

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

  const handleView = useCallback(async (note: any) => {
    if (!note.fileData) {
      toast.error("File data missing");
      return;
    }
    try {
      // Decode base64 → Blob (keeps fileData off the URL bar)
      const byteString = atob(note.fileData.split(',')[1]);
      const mimeString = note.fileData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeString });
      const blobUrl = URL.createObjectURL(blob);
      const isPdf = note.fileType?.toLowerCase() === 'pdf' || mimeString.includes('pdf');

      setViewingNote({ title: note.title, blobUrl, isPdf });

      // Track the view via the dedicated endpoint (non-blocking)
      const token = sessionStorage.getItem('token');
      fetch(`/api/notes/${note.id}/download`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {/* non-fatal */});

    } catch (e) {
      console.error("Failed to view file", e);
      toast.error("Failed to open file viewer");
    }
  }, []);

  const closeViewer = useCallback(() => {
    if (viewingNote?.blobUrl) URL.revokeObjectURL(viewingNote.blobUrl);
    setViewingNote(null);
  }, [viewingNote]);

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
        <h1 className="text-3xl font-bold">Study Notes</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search notes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="shrink-0">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8 text-gray-500">Loading notes...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredNotes.length === 0 ? (
                <p className="text-center p-4 text-gray-500">No notes available.</p>
              ) : (
                filteredNotes.map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold">{note.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline">{note.subject}</Badge>
                            <Badge variant="secondary">{note.chapter}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar size={14} />
                          {note.uploadDate}
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-3">
                          <span className="text-sm text-gray-500">{note.fileSize}</span>
                          <Button size="sm" onClick={() => handleView(note)}>
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Secure In-App Note Viewer ───────────────────────────────────────── */}
      {viewingNote && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col bg-neutral-900"
          onContextMenu={(e) => e.preventDefault()}   // disable right-click
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-neutral-800 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              <span className="text-white font-semibold text-sm truncate max-w-xs">{viewingNote.title}</span>
              <span className="hidden sm:flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                <ShieldAlert size={11} />
                View Only — Downloading disabled
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeViewer}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Viewer — iframe with all browser toolbar controls stripped */}
          <div className="flex-1 relative overflow-hidden select-none">
            {viewingNote.isPdf ? (
              <iframe
                src={`${viewingNote.blobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full border-none"
                title={viewingNote.title}
                sandbox="allow-same-origin allow-scripts"  // no allow-downloads, no allow-popups
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              // Image viewer
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={viewingNote.blobUrl}
                  alt={viewingNote.title}
                  className="max-w-full max-h-full object-contain pointer-events-none select-none"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}

            {/* Invisible overlay — prevents drag-to-save on images and right-click on iframe */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            />
          </div>

          {/* Bottom notice */}
          <div className="flex items-center justify-center gap-2 py-2 bg-neutral-800 border-t border-white/10 shrink-0">
            <ShieldAlert size={12} className="text-yellow-500" />
            <span className="text-white/40 text-xs">This material is protected. Downloading and screen capture are not permitted.</span>
          </div>
        </div>
      )}
    </div>
  );
};
