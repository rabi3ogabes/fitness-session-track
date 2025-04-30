
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data
const membershipData = [
  { name: "Jan", Basic: 20, Standard: 15, Premium: 10 },
  { name: "Feb", Basic: 22, Standard: 18, Premium: 12 },
  { name: "Mar", Basic: 25, Standard: 20, Premium: 15 },
  { name: "Apr", Basic: 30, Standard: 22, Premium: 18 },
];

const attendanceData = [
  { name: "Mon", value: 45 },
  { name: "Tue", value: 52 },
  { name: "Wed", value: 48 },
  { name: "Thu", value: 56 },
  { name: "Fri", value: 60 },
  { name: "Sat", value: 35 },
  { name: "Sun", value: 20 },
];

const classPopularityData = [
  { name: "Yoga", value: 35 },
  { name: "HIIT", value: 25 },
  { name: "Strength", value: 20 },
  { name: "Boxing", value: 15 },
  { name: "Pilates", value: 10 },
];

const revenueData = [
  { month: "Jan", revenue: 2500 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 3500 },
  { month: "Apr", revenue: 4000 },
];

const COLORS = ["#2563eb", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

const Reports = () => {
  const [reportType, setReportType] = useState("memberships");

  return (
    <DashboardLayout title="Reports & Analytics">
      <div className="mb-6 flex space-x-2">
        <Button
          onClick={() => setReportType("memberships")}
          variant={reportType === "memberships" ? "default" : "outline"}
          className={reportType === "memberships" ? "bg-gym-blue hover:bg-gym-dark-blue" : ""}
        >
          Memberships
        </Button>
        <Button
          onClick={() => setReportType("attendance")}
          variant={reportType === "attendance" ? "default" : "outline"}
          className={reportType === "attendance" ? "bg-gym-blue hover:bg-gym-dark-blue" : ""}
        >
          Attendance
        </Button>
        <Button
          onClick={() => setReportType("classes")}
          variant={reportType === "classes" ? "default" : "outline"}
          className={reportType === "classes" ? "bg-gym-blue hover:bg-gym-dark-blue" : ""}
        >
          Class Popularity
        </Button>
        <Button
          onClick={() => setReportType("revenue")}
          variant={reportType === "revenue" ? "default" : "outline"}
          className={reportType === "revenue" ? "bg-gym-blue hover:bg-gym-dark-blue" : ""}
        >
          Revenue
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {reportType === "memberships" && (
          <>
            <h2 className="text-xl font-bold mb-6">Membership Distribution (Last 4 Months)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={membershipData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Basic" fill="#2563eb" />
                  <Bar dataKey="Standard" fill="#8b5cf6" />
                  <Bar dataKey="Premium" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {reportType === "attendance" && (
          <>
            <h2 className="text-xl font-bold mb-6">Weekly Attendance (Current Week)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attendanceData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Attendees" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {reportType === "classes" && (
          <>
            <h2 className="text-xl font-bold mb-6">Class Popularity (Current Month)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classPopularityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {classPopularityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {reportType === "revenue" && (
          <>
            <h2 className="text-xl font-bold mb-6">Revenue Analysis (Last 4 Months)</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue ($)" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Key Insights</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Membership growth: <span className="font-medium text-green-600">+15%</span> compared to last quarter</li>
            <li>Most popular day: <span className="font-medium">Friday</span> with an average of 60 attendees</li>
            <li>Most popular class: <span className="font-medium">Yoga</span> with 35% attendance rate</li>
            <li>Revenue increase: <span className="font-medium text-green-600">+12%</span> month-over-month</li>
            <li>Retention rate: <span className="font-medium text-green-600">87%</span> for premium members</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Actions & Recommendations</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Increase marketing efforts for <span className="font-medium">Pilates classes</span> to boost attendance</li>
            <li>Consider offering <span className="font-medium">Sunday promotions</span> to increase weekend attendance</li>
            <li>Focus on converting <span className="font-medium">Basic members to Standard</span> with targeted offers</li>
            <li>Analyze instructor performance for <span className="font-medium">Boxing classes</span> to improve popularity</li>
            <li>Implement a <span className="font-medium">referral program</span> to boost Premium membership sign-ups</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generate Reports</h2>
          <div className="space-x-2">
            <Button variant="outline" className="border-gym-blue text-gym-blue hover:bg-gym-light">
              Export CSV
            </Button>
            <Button variant="outline" className="border-gym-blue text-gym-blue hover:bg-gym-light">
              Print Report
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            Membership Report
          </Button>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            Attendance Report
          </Button>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            Revenue Report
          </Button>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            Class Popularity Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
