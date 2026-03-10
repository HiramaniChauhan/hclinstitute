
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Edit, Trash2, Download, Calendar } from "lucide-react";
import { useState } from "react";

export const NotesManagement = () => {
  const [notes] = useState([
    {
      id: 1,
      title: "Mathematics Formula Sheet",
      subject: "Mathematics",
      chapter: "Calculus",
      uploadedBy: "Dr. Rajesh Kumar",
      uploadDate: "2024-01-15",
      fileType: "PDF",
      fileSize: "2.5 MB",
      downloads: 125
    },
    {
      id: 2,
      title: "Reasoning Shortcuts",
      subject: "Reasoning",
      chapter: "Logical Reasoning",
      uploadedBy: "Prof. Priya Sharma",
      uploadDate: "2024-01-14",
      fileType: "PDF",
      fileSize: "1.8 MB",
      downloads: 89
    },
    {
      id: 3,
      title: "Programming Concepts",
      subject: "Computer",
      chapter: "Programming Fundamentals",
      uploadedBy: "Er. Amit Singh",
      uploadDate: "2024-01-12",
      fileType: "PDF",
      fileSize: "3.2 MB",
      downloads: 67
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notes Management</h1>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload New Note
        </Button>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Study Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Note Title" />
            <select className="px-3 py-2 border rounded-lg">
              <option value="">Select Subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Reasoning">Reasoning</option>
              <option value="Computer">Computer</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Chapter Name" />
            <Input placeholder="Teacher Name" />
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Drag and drop files here or click to browse</p>
            <p className="text-sm text-gray-500 mt-1">PDF files only, max 10MB</p>
          </div>
          <Button className="w-full">Upload Note</Button>
        </CardContent>
      </Card>

      {/* Notes List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold">{note.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{note.subject}</Badge>
                        <Badge variant="secondary">{note.chapter}</Badge>
                        <span className="text-sm text-gray-600">by {note.uploadedBy}</span>
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
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
