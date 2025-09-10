import * as React from "react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarWithClassesProps = React.ComponentProps<typeof DayPicker> & {
  showClassIndicators?: boolean;
};

interface ClassData {
  id: number;
  schedule: string;
  name: string;
}

function CalendarWithClasses({
  className,
  classNames,
  showOutsideDays = true,
  showClassIndicators = true,
  ...props
}: CalendarWithClassesProps) {
  const [classesData, setClassesData] = useState<ClassData[]>([]);

  useEffect(() => {
    if (showClassIndicators) {
      fetchClasses();
    }
  }, [showClassIndicators]);

  const fetchClasses = async () => {
    try {
      const { data: classes, error } = await supabase
        .from("classes")
        .select("id, schedule, name")
        .eq("status", "Active");

      if (error) {
        console.error("Error fetching classes:", error);
        return;
      }

      setClassesData(classes || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const hasClassOnDate = (date: Date) => {
    if (!showClassIndicators) return false;
    
    return classesData.some(cls => {
      try {
        const classDate = new Date(cls.schedule);
        return isSameDay(date, classDate);
      } catch {
        return false;
      }
    });
  };

  const getClassesForDate = (date: Date) => {
    if (!showClassIndicators) return [];
    
    return classesData.filter(cls => {
      try {
        const classDate = new Date(cls.schedule);
        return isSameDay(date, classDate);
      } catch {
        return false;
      }
    });
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white rounded-md shadow-sm pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-purple-500 text-primary-foreground hover:bg-purple-600 hover:text-primary-foreground focus:bg-purple-500 focus:text-primary-foreground",
        day_today: "bg-purple-50 text-purple-800 border border-purple-300",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        DayContent: props.components?.DayContent || (({ date, ...dayProps }) => {
          const hasClasses = hasClassOnDate(date);
          const classesOnDate = getClassesForDate(date);
          
          return (
            <div {...dayProps} className="relative w-full h-full flex items-center justify-center">
              {format(date, 'd')}
              {hasClasses && showClassIndicators && (
                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2">
                  {classesOnDate.length === 1 ? (
                    <Circle className="h-1.5 w-1.5 fill-purple-500 text-purple-500" />
                  ) : (
                    <div className="flex gap-0.5">
                      <Circle className="h-1 w-1 fill-purple-500 text-purple-500" />
                      <Circle className="h-1 w-1 fill-purple-500 text-purple-500" />
                      {classesOnDate.length > 2 && (
                        <Circle className="h-1 w-1 fill-purple-500 text-purple-500" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }),
      }}
      formatters={{
        formatCaption: (date, options) => {
          return format(date, 'MMMM yyyy', options);
        },
        formatDay: (date, options) => {
          return format(date, 'd', options);
        }
      }}
      styles={{
        day: { color: 'inherit', fontWeight: 'normal', fontSize: '0.875rem' },
        caption: { textAlign: 'center' }
      }}
      {...props}
    />
  );
}

CalendarWithClasses.displayName = "CalendarWithClasses";

export { CalendarWithClasses };