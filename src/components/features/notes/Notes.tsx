import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Search, Filter, FileText, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export const Notes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleView = async (note: any) => {
    if (note.fileData) {
      try {
        // Convert base64 data URL to Blob for safe rendering in a new tab
        const byteString = atob(note.fileData.split(',')[1]);
        const mimeString = note.fileData.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const blobUrl = URL.createObjectURL(blob);

        // Open the blob URL in a custom secure viewer (hides toolbar & disables right click)
        const viewer = window.open('', '_blank');
        if (viewer) {
          const isPdf = note.fileType?.toLowerCase() === 'pdf' || mimeString.includes('pdf');
          const renderUrl = isPdf ? `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0` : blobUrl;

          viewer.document.write(`
            <html>
              <head>
                <title>${note.title} - View Only</title>
                <style>
                  body { margin: 0; padding: 0; overflow: hidden; background-color: #333; }
                  iframe { width: 100vw; height: 100vh; border: none; }
                </style>
              </head>
              <body oncontextmenu="return false;" onkeydown="return false;">
                <iframe src="${renderUrl}" oncontextmenu="return false;"></iframe>
              </body>
            </html>
          `);
        }

        // Increment views (still stored as downloads in db for now)
        const token = sessionStorage.getItem('token');
        await fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ...note, downloads: (note.downloads || 0) + 1 })
        });
        fetchNotes(); // Silently refresh
      } catch (e) {
        console.error("Failed to view file", e);
        toast.error("Failed to open file viewer");
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
        <>
          {/* All Notes List */}
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
                              <span className="text-sm text-gray-600">by {note.uploadedBy}</span>
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
        </>
      )}
    </div>
  );
};
