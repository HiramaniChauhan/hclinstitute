
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter, FileText, Calendar } from "lucide-react";

export const Notes = () => {
  const notes = [
    {
      id: 1,
      title: "Mathematics Formula Sheet",
      subject: "Mathematics",
      chapter: "Calculus",
      uploadedBy: "Dr. Rajesh Kumar",
      uploadDate: "2024-01-15",
      fileType: "PDF",
      fileSize: "2.5 MB"
    },
    {
      id: 2,
      title: "Reasoning Shortcuts",
      subject: "Reasoning",
      chapter: "Logical Reasoning",
      uploadedBy: "Prof. Priya Sharma",
      uploadDate: "2024-01-14",
      fileType: "PDF",
      fileSize: "1.8 MB"
    },
    {
      id: 3,
      title: "Programming Concepts",
      subject: "Computer",
      chapter: "Programming Fundamentals",
      uploadedBy: "Er. Amit Singh",
      uploadDate: "2024-01-12",
      fileType: "PDF",
      fileSize: "3.2 MB"
    },
    {
      id: 4,
      title: "Important Formulas - Integration",
      subject: "Mathematics",
      chapter: "Calculus",
      uploadedBy: "Dr. Rajesh Kumar",
      uploadDate: "2024-01-10",
      fileType: "PDF",
      fileSize: "1.5 MB"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Study Notes</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input placeholder="Search notes..." className="pl-10 w-64" />
          </div>
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Subject-wise Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-700">Mathematics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notes.filter(note => note.subject === "Mathematics").map(note => (
                <div key={note.id} className="p-3 bg-white rounded-lg border">
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  <p className="text-xs text-gray-600">{note.chapter}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{note.fileSize}</span>
                    <Button size="sm" variant="outline">
                      <Download size={12} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Reasoning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notes.filter(note => note.subject === "Reasoning").map(note => (
                <div key={note.id} className="p-3 bg-white rounded-lg border">
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  <p className="text-xs text-gray-600">{note.chapter}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{note.fileSize}</span>
                    <Button size="sm" variant="outline">
                      <Download size={12} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg text-purple-700">Computer Science</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notes.filter(note => note.subject === "Computer").map(note => (
                <div key={note.id} className="p-3 bg-white rounded-lg border">
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  <p className="text-xs text-gray-600">{note.chapter}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{note.fileSize}</span>
                    <Button size="sm" variant="outline">
                      <Download size={12} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Notes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notes</CardTitle>
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
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar size={14} />
                      {note.uploadDate}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{note.fileSize}</span>
                      <Button size="sm">
                        <Download size={14} className="mr-1" />
                        Download
                      </Button>
                    </div>
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
