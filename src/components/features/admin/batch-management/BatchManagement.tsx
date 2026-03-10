
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, Clock, Plus, UserPlus, Search } from "lucide-react";
import { dummyBatches } from "@/data/batchData";

export const BatchManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Batch Management</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Batch
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Batches</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">245</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Batches</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch List */}
      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input placeholder="Search batches..." className="pl-10 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dummyBatches.map((batch) => (
              <div key={batch.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{batch.name}</h3>
                    <p className="text-gray-600">{batch.course}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {batch.enrolledStudents.length} / {batch.maxStudents} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {batch.startDate} to {batch.endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {batch.timing}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={batch.status === 'Active' ? 'default' : batch.status === 'Upcoming' ? 'secondary' : 'outline'}>
                        {batch.status}
                      </Badge>
                      <Badge variant="outline">{batch.instructor}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <UserPlus size={14} className="mr-1" />
                      Add Students
                    </Button>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create New Batch Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Batch Name</label>
              <Input placeholder="Enter batch name" />
            </div>
            <div>
              <label className="text-sm font-medium">Course</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Complete Mathematics Mastery</SelectItem>
                  <SelectItem value="reasoning">Logical Reasoning & Aptitude</SelectItem>
                  <SelectItem value="computer">Computer Science Fundamentals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Instructor</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rajesh">Dr. Rajesh Kumar</SelectItem>
                  <SelectItem value="priya">Prof. Priya Sharma</SelectItem>
                  <SelectItem value="amit">Er. Amit Singh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Max Students</label>
              <Input type="number" placeholder="30" />
            </div>
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Timing</label>
            <Input placeholder="e.g., 09:00 AM - 11:00 AM" />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Create Batch</Button>
        </CardContent>
      </Card>
    </div>
  );
};
