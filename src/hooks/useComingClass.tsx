import { useAuth } from "@/context/AuthContext";
import { ClassModel } from "@/pages/admin/components/classes/ClassTypes";
import { isAfter, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
interface ClassWithBooking extends ClassModel {
  type?: string;
  isBooked?: boolean;
}
const DEMO_CLASSES: ClassWithBooking[] = [
  {
    id: 1,
    name: "Yoga Basics",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 1)
    ).toISOString(),
    start_time: "09:00",
    end_time: "10:00",
    capacity: 20,
    enrolled: 8,
    trainer: "Jane Smith",
    location: "Studio 1",
    type: "yoga",
    isBooked: false,
  },
  {
    id: 2,
    name: "HIIT Workout",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 1)
    ).toISOString(),
    start_time: "11:00",
    end_time: "12:00",
    capacity: 15,
    enrolled: 12,
    trainer: "John Doe",
    location: "Gym Floor",
    type: "workout",
    isBooked: false,
  },
  {
    id: 3,
    name: "Boxing Fundamentals",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 2)
    ).toISOString(),
    start_time: "14:00",
    end_time: "15:30",
    capacity: 10,
    enrolled: 5,
    trainer: "Mike Tyson",
    location: "Boxing Ring",
    type: "combat",
    isBooked: false,
  },
  {
    id: 4,
    name: "Zumba Dance",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 3)
    ).toISOString(),
    start_time: "16:00",
    end_time: "17:00",
    capacity: 25,
    enrolled: 15,
    trainer: "Maria Lopez",
    location: "Dance Studio",
    type: "dance",
    isBooked: false,
  },
  {
    id: 5,
    name: "Pilates Morning",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 4)
    ).toISOString(),
    start_time: "08:00",
    end_time: "09:00",
    capacity: 15,
    enrolled: 6,
    trainer: "Sarah Wilson",
    location: "Studio 2",
    type: "yoga",
    isBooked: false,
  },
  {
    id: 6,
    name: "Cardio Blast",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 5)
    ).toISOString(),
    start_time: "18:00",
    end_time: "19:00",
    capacity: 20,
    enrolled: 12,
    trainer: "Alex Johnson",
    location: "Gym Floor",
    type: "workout",
    isBooked: false,
  },
  {
    id: 7,
    name: "Women Only Strength Training",
    status: "Active",
    schedule: new Date(
      new Date().setDate(new Date().getDate() + 6)
    ).toISOString(),
    start_time: "17:00",
    end_time: "18:00",
    capacity: 12,
    enrolled: 8,
    trainer: "Emma Davis",
    location: "Weight Room",
    type: "workout",
    gender: "Female",
    isBooked: false,
  },
];
export default function useComingClass() {
  const [availableClasses, setAvailableClasses] = useState<ClassWithBooking[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkConnected, setIsNetworkConnected] = useState(
    navigator.onLine
  );
  const { user } = useAuth();
  const unbookedClasses = useMemo(() => {
    const now = new Date();
    return availableClasses
      .filter((cls) => {
        // Filter out classes that are booked or in the past
        const classDate = new Date(cls.schedule);
        return (
          !cls.isBooked &&
          (isAfter(classDate, now) || isSameDay(classDate, now))
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.schedule);
        const dateB = new Date(b.schedule);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.start_time && b.start_time
          ? a.start_time.localeCompare(b.start_time)
          : 0;
      });
  }, [availableClasses]);
  const fetchClasses = useCallback(async () => {
    if (!isNetworkConnected && !user) return;

    setIsLoading(true);
    setError(null);
    try {
      if (!isNetworkConnected) {
        setAvailableClasses(
          DEMO_CLASSES.map((cls) => ({ ...cls, isBooked: false }))
        );
        setError("You're offline. Using demo class data.");
        return;
      }
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("status", "Active")
        .order("schedule", { ascending: true });
      if (classesError) throw classesError;
      if (!classesData || classesData.length === 0) {
        setAvailableClasses(DEMO_CLASSES);
        setError("No classes found in the database. Using demo data.");
        return;
      }
      const classesWithType = classesData.map((cls: ClassModel) => {
        let type = "default";
        const name = cls.name.toLowerCase();
        if (name.includes("yoga") || name.includes("pilates")) {
          type = "yoga";
        } else if (
          name.includes("boxing") ||
          name.includes("mma") ||
          name.includes("martial")
        ) {
          type = "combat";
        } else if (name.includes("zumba") || name.includes("dance")) {
          type = "dance";
        } else if (
          name.includes("workout") ||
          name.includes("training") ||
          name.includes("hiit") ||
          name.includes("cardio") ||
          name.includes("strength")
        ) {
          type = "workout";
        }

        return { ...cls, type, isBooked: false };
      });
      if (user?.id === "demo-user-id") {
        setAvailableClasses(
          classesWithType.map((cls) => ({
            ...cls,
            isBooked: cls.id === 3,
          }))
        );
        return;
      }
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("class_id")
        .eq("user_id", user.id);
      if (bookingsError) throw bookingsError;

      const bookedClassIds =
        bookingsData?.map((booking) => booking.class_id) || [];
      setAvailableClasses(
        classesWithType.map((cls) => ({
          ...cls,
          isBooked: bookedClassIds.includes(cls.id),
        }))
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      setAvailableClasses(DEMO_CLASSES);
      setError("Failed to load classes. Using demo data instead.");
    } finally {
      setIsLoading(false);
    }
  }, [isNetworkConnected, user]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);
  return {
    fetchClasses,
    isLoading,
    error,
    setIsNetworkConnected,
    unbookedClasses,
    setError,
    setIsLoading,
    setAvailableClasses
  };
}
