
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// Mock user data (would typically come from auth context)
const currentUser = {
  gender: "Male" // Could be "Male", "Female", or undefined for no restriction
};

// Mock schedule data with gender specifications
const scheduleData = [
  {
    day: "Monday",
    classes: [
      { id: 1, name: "Morning Yoga", time: "08:00 - 09:00", trainer: "Jane Doe", level: "All Levels", gender: "All" },
      { id: 2, name: "HIIT Workout", time: "10:00 - 11:00", trainer: "John Smith", level: "Intermediate", gender: "All" },
      { id: 3, name: "Strength Training", time: "17:00 - 18:00", trainer: "Alex Johnson", level: "Beginner", gender: "Male" },
    ],
  },
  {
    day: "Tuesday",
    classes: [
      { id: 4, name: "Pilates", time: "09:00 - 10:00", trainer: "Sarah Williams", level: "All Levels", gender: "Female" },
      { id: 5, name: "Boxing", time: "18:00 - 19:00", trainer: "Mike Tyson", level: "Advanced", gender: "Male" },
    ],
  },
  {
    day: "Wednesday",
    classes: [
      { id: 6, name: "Morning Yoga", time: "08:00 - 09:00", trainer: "Jane Doe", level: "All Levels", gender: "All" },
      { id: 7, name: "Zumba", time: "16:00 - 17:00", trainer: "Maria Garcia", level: "All Levels", gender: "All" },
      { id: 8, name: "Crossfit", time: "18:00 - 19:00", trainer: "Chris Evans", level: "Advanced", gender: "All" },
    ],
  },
  {
    day: "Thursday",
    classes: [
      { id: 9, name: "Pilates", time: "09:00 - 10:00", trainer: "Sarah Williams", level: "All Levels", gender: "Female" },
      { id: 10, name: "HIIT Workout", time: "10:00 - 11:00", trainer: "John Smith", level: "Intermediate", gender: "All" },
      { id: 11, name: "Strength Training", time: "17:00 - 18:00", trainer: "Alex Johnson", level: "Beginner", gender: "Male" },
    ],
  },
  {
    day: "Friday",
    classes: [
      { id: 12, name: "Morning Yoga", time: "08:00 - 09:00", trainer: "Jane Doe", level: "All Levels", gender: "All" },
      { id: 13, name: "Boxing", time: "18:00 - 19:00", trainer: "Mike Tyson", level: "Advanced", gender: "Male" },
    ],
  },
  {
    day: "Saturday",
    classes: [
      { id: 14, name: "Zumba", time: "10:00 - 11:00", trainer: "Maria Garcia", level: "All Levels", gender: "Female" },
      { id: 15, name: "Strength Training", time: "16:00 - 17:00", trainer: "Alex Johnson", level: "All Levels", gender: "All" },
    ],
  },
  {
    day: "Sunday",
    classes: [],
  },
];

// Apply gender filter to classes
const filterClassesByGender = (classes) => {
  return classes.filter(cls => 
    cls.gender === "All" || cls.gender === currentUser.gender
  );
};

// Filter days with classes based on gender
const filteredScheduleData = scheduleData.map(day => ({
  ...day,
  classes: filterClassesByGender(day.classes)
}));

// Mock class events for calendar with gender filter applied
const allClassEvents = [
  { date: new Date(2025, 3, 1), className: "Morning Yoga", gender: "All" },
  { date: new Date(2025, 3, 3), className: "HIIT Workout", gender: "All" },
  { date: new Date(2025, 3, 5), className: "Pilates", gender: "Female" },
  { date: new Date(2025, 3, 8), className: "Boxing", gender: "Male" },
  { date: new Date(2025, 3, 10), className: "Zumba", gender: "All" },
  { date: new Date(2025, 3, 15), className: "Strength Training", gender: "Male" },
  { date: new Date(2025, 3, 17), className: "Crossfit", gender: "All" },
  { date: new Date(2025, 3, 22), className: "Morning Yoga", gender: "All" },
  { date: new Date(2025, 3, 24), className: "HIIT Workout", gender: "All" },
  { date: new Date(2025, 3, 29), className: "Boxing", gender: "Male" },
  { date: new Date(2025, 4, 1), className: "Morning Yoga", gender: "All" },
  { date: new Date(2025, 4, 3), className: "HIIT Workout", gender: "All" },
  { date: new Date(2025, 4, 5), className: "Pilates", gender: "Female" },
  { date: new Date(2025, 4, 8), className: "Boxing", gender: "Male" },
];

// Filter class events based on user gender
const classEvents = allClassEvents.filter(event => 
  event.gender === "All" || event.gender === currentUser.gender
);

const UserSchedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Get classes for the selected date
  const classesForSelectedDate = classEvents.filter(event => 
    event.date.getDate() === selectedDate.getDate() &&
    event.date.getMonth() === selectedDate.getMonth() &&
    event.date.getFullYear() === selectedDate.getFullYear()
  );
  
  // Function to check if a day has classes
  const isDayWithClass = (date: Date) => {
    return classEvents.some(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };
  
  // Custom day content renderer for the calendar
  const DayContent = (props: any) => {
    const { date, ...otherProps } = props;
    
    // Check if there are classes on this day
    const hasClasses = isDayWithClass(date);
    
    return (
      <div className="flex flex-col items-center">
        <div {...otherProps} />
        {hasClasses && (
          <div className="w-1 h-1 bg-gym-blue rounded-full mt-0.5" />
        )}
      </div>
    );
  };
  
  return (
    <DashboardLayout title="Class Schedule">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-gym-blue" />
              Monthly View
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Calendar 
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="border bg-white rounded-md shadow-sm pointer-events-auto w-full"
              components={{
                DayContent: DayContent,
              }}
              modifiers={{
                hasClass: isDayWithClass
              }}
              modifiersClassNames={{
                hasClass: "bg-gym-light text-gym-blue font-medium"
              }}
            />
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">
                Classes on {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              
              {classesForSelectedDate.length > 0 ? (
                <div className="space-y-2">
                  {classesForSelectedDate.map((event, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-md">
                      <div className="font-medium">{event.className}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-2">No classes scheduled for this day</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Weekly Class Schedule</h2>
            
            <div className="space-y-8">
              {filteredScheduleData.map((daySchedule) => (
                <div key={daySchedule.day} className="border-b pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-semibold mb-4 text-gym-blue">{daySchedule.day}</h3>
                  
                  {daySchedule.classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {daySchedule.classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="p-4 border border-gray-200 rounded-md hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-semibold">{cls.name}</h4>
                          <div className="text-sm text-gray-500 mt-2">
                            <p>⏰ {cls.time}</p>
                            <p>👨‍🏫 {cls.trainer}</p>
                            <p className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  cls.level === "Beginner"
                                    ? "bg-green-100 text-green-800"
                                    : cls.level === "Intermediate"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : cls.level === "Advanced"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {cls.level}
                              </span>
                              
                              {cls.gender !== "All" && (
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    cls.gender === "Male"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-pink-100 text-pink-800"
                                  }`}
                                >
                                  {cls.gender} Only
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No classes scheduled for this day.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Class Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Class Booking Policy</h3>
            <p className="text-sm text-gray-600">
              Classes can be booked up to 7 days in advance. To secure your spot, please book at least 2 hours before the class starts.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Cancellation Policy</h3>
            <p className="text-sm text-gray-600">
              If you need to cancel your booking, please do so at least 4 hours before the class to avoid losing your session credit.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Level Guide</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Beginner</span>
                {" "}- Suitable for those new to the activity or returning after a break.
              </p>
              <p>
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">Intermediate</span>
                {" "}- For those with some experience who are looking to improve.
              </p>
              <p>
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Advanced</span>
                {" "}- Challenging classes for experienced participants.
              </p>
              <p>
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">All Levels</span>
                {" "}- Classes with modifications available for all fitness levels.
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Gender-Specific Classes</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Male Only</span>
                {" "}- Classes exclusively for male members.
              </p>
              <p>
                <span className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-800">Female Only</span>
                {" "}- Classes exclusively for female members.
              </p>
              <p>Note: Your schedule shows only classes that match your profile settings.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSchedule;
