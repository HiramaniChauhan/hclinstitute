
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp, Monitor } from "lucide-react";

export const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Students",
      value: "1,234",
      icon: Users,
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Active Tests",
      value: "45",
      icon: FileText,
      change: "+3",
      changeType: "positive"
    },
    {
      title: "Avg Performance",
      value: "78.5%",
      icon: TrendingUp,
      change: "+2.3%",
      changeType: "positive"
    },
    {
      title: "Online Now",
      value: "156",
      icon: Monitor,
      change: "+23",
      changeType: "positive"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, Admin!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                "New test 'Physics Chapter 1' created",
                "Student John Doe completed Math Test",
                "Video lecture uploaded: Chemistry Basics",
                "Performance report generated for Class 12A"
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">{activity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Server Status", status: "Online", color: "green" },
                { name: "Database", status: "Connected", color: "green" },
                { name: "Video Service", status: "Running", color: "green" },
                { name: "Notification Service", status: "Active", color: "green" }
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{service.name}</span>
                  <span className={`text-sm px-2 py-1 rounded-full bg-${service.color}-100 text-${service.color}-800`}>
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
