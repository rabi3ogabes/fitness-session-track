
import DashboardLayout from "@/components/DashboardLayout";

// Mock schedule data
const scheduleData = [
  {
    day: "Monday",
    classes: [
      { id: 1, name: "Morning Yoga", time: "08:00 - 09:00", trainer: "Jane Doe", level: "All Levels" },
      { id: 2, name: "HIIT Workout", time: "10:00 - 11:00", trainer: "John Smith", level: "Intermediate" },
      { id: 3, name: "Strength Training", time: "17:00 - 18:00", trainer: "Alex Johnson", level: "Beginner" },
    ],
  },
  {
    day: "Tuesday",
    classes: [
      { id: 4, name: "Pilates", time: "09:00 - 10:00", trainer: "Sarah Williams", level: "All Levels" },
      { id: 5, name: "Boxing", time: "18:00 - 19:00", trainer: "Mike Tyson", level: "Advanced" },
    ],
  },
  {
    day: "Wednesday",
    classes: [
      { id: 6, name: "Morning Yoga", time: "08:00 - 09:00", trainer: "Jane Doe", level: "All Levels" },
      { id: 7, name: "Zumba", time: "16:00 - 17:00", trainer: "Maria Garcia", level: "All Levels" },
      { id: 8, name: "Crossfit", time: "18:00 - 19:00", trainer: "Chris Evans", level: "Advanced" },
    ],
  },
  {
    day: "Thursday",
    classes: [
      { id: 9, name: "Pilates", time: "09:00 - 10:00", trainer: "Sarah Williams", level: "All Levels" },
      { id: 10, name: "HIIT Workout", time: "10:00 - 11:00", trainer: "John Smith", level: "Intermediate" },
      { id: 11, name: "Strength Training", time: "17:00 - 18:00", trainer: "Alex Johnson", level: "Beginner" },
    ],
  },
  {
    day: "Friday",
    classes: [
      { id: 12, name: "Morning Yoga", time: "08:00 - 09:00", trainer: "Jane Doe", level: "All Levels" },
      { id: 13, name: "Boxing", time: "18:00 - 19:00", trainer: "Mike Tyson", level: "Advanced" },
    ],
  },
  {
    day: "Saturday",
    classes: [
      { id: 14, name: "Zumba", time: "10:00 - 11:00", trainer: "Maria Garcia", level: "All Levels" },
      { id: 15, name: "Strength Training", time: "16:00 - 17:00", trainer: "Alex Johnson", level: "All Levels" },
    ],
  },
  {
    day: "Sunday",
    classes: [],
  },
];

const UserSchedule = () => {
  return (
    <DashboardLayout title="Class Schedule">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Weekly Class Schedule</h2>
        
        <div className="space-y-8">
          {scheduleData.map((daySchedule) => (
            <div key={daySchedule.day} className="border-b pb-6 last:border-b-0 last:pb-0">
              <h3 className="text-lg font-semibold mb-4 text-gym-blue">{daySchedule.day}</h3>
              
              {daySchedule.classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {daySchedule.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-4 border border-gray-200 rounded-md hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-semibold">{cls.name}</h4>
                      <div className="text-sm text-gray-500 mt-2">
                        <p>⏰ {cls.time}</p>
                        <p>👨‍🏫 {cls.trainer}</p>
                        <p>
                          Level:{" "}
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSchedule;
