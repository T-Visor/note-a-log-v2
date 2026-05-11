"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarCheck, CalendarClock, CalendarPlus, Download, ExternalLink, Pin, Plus, X } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import useNotesStore from "@/stores/useNotesStore";
import { toast } from "sonner";
import { isToday, howManyDaysAhead, getMonthDayYearFromDateString, getNextReminderForNote } from "@/lib/date-time";

const CalendarDialog = () => {
  const { currentNote, updateNote } = useNotesStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarEventTitle, setCalendarEventTitle] = useState(currentNote?.title || "");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  
  const currentReminder = useMemo(() => {
    if (currentNote?.reminders)
      return getNextReminderForNote(currentNote?.reminders);
  }, [currentNote?.reminders]);

  useEffect(() => {
    setCalendarEventTitle(currentNote?.title || "");
  }, [currentNote?.id, currentNote?.title]);

  const setReminderDateForNote = () => {
    let reminders: string[];

    if (currentNote?.reminders)
      reminders = currentNote?.reminders;
    else
      reminders = [];

    if (date && currentNote) {
      reminders.push(date.toISOString());

      updateNote(currentNote.id, {
        reminders: reminders
      });
    }
  };

  const openInGoogleCalendar = () => {
    if (!date)
      return;

    const title = encodeURIComponent(calendarEventTitle);
    const noteUrl = encodeURIComponent(`${window.location.origin}/note/?id=${currentNote?.id}`);

    const startTime = "090000"; // 9:00 AM
    const endTime = "100000"    // 10:00 AM
    const dateOfReminder = format(date, "yyyyMMdd");

    const googleCalendarURL = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=Link+to+note:+${noteUrl}&dates=${dateOfReminder}T${startTime}/${dateOfReminder}T${endTime}`;
    window.open(googleCalendarURL, "_blank");
  };

  const saveCalendarInvite = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!date)
      return;

    const formatICSAllDay = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, "");
    const formatICSDateTime = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const title = calendarEventTitle;
    const noteUrl = `${window.location.origin}/note/?id=${currentNote?.id}`;
    const now = formatICSDateTime(new Date());

    const startDate = new Date(date);
    const endDate = addDays(startDate, 1); // Makes it an all-day event

    const startDateICSFormat = formatICSAllDay(startDate);
    const endDateICSFormat = formatICSAllDay(endDate);

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Note-a-log//NONSGML v1.0//EN",
      "BEGIN:VEVENT",
      `UID:${currentNote?.id}-${Date.now()}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDateICSFormat}`,
      `DTEND;VALUE=DATE:${endDateICSFormat}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Link to note: ${noteUrl}`,
      `URL;VALUE=URI:${noteUrl}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT15H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Tomorrow",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    const calendarData = icsLines.join("\r\n");
    const blob = new Blob([calendarData], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CalendarWithPresets = () => (
    <>
      <Card className="flex-col justify-center items-center mx-auto max-w-fit border-0 shadow-none bg-transparent pt-2">
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disables dates before today
            className="p-0"
          />
        </CardContent>
      </Card>
    </>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={`${currentReminder ? "outline" : "ghost"}`}
          className="rounded-full shadow-none gap-1.5"
        >
          {currentReminder ? (
            <>
              <CalendarClock className="size-4" />
              <span className="tabular-nums">
                {isToday(currentReminder)
                  ? "Today"
                  : format(new Date(currentReminder), "MMM dd")}
              </span>
            </>
          ) : (
            <>
              {/*<span>Schedule</span>*/}
              <CalendarPlus className="size-4.5" />
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-950 focus:outline-none">
        <DialogHeader className="py-1">
          <DialogTitle className="pb-2">Schedule</DialogTitle>
          {(currentNote?.reminders) && (
            currentNote.reminders.toSorted(
              (left, right) => +new Date(left) - +new Date(right)
            ).map((reminder) => {
              return (
                <div className="flex justify-center items-center">
                  <span
                    className="flex justify-center items-center text-sm gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-900 hover:cursor-pointer hover:dark:bg-gray-800 hover:bg-gray-200"
                    onClick={() => {
                      updateNote(currentNote.id, {
                        reminders: currentNote.reminders?.filter(keepIf => keepIf !== reminder)
                      })
                    }}
                  >
                    {isToday(reminder) ? "Today" : getMonthDayYearFromDateString(reminder)}
                    <X className="!size-3" />
                  </span>
                </div>
              );
            })
          )}
        </DialogHeader>
        <CalendarWithPresets />
        <DialogFooter className="flex flex-row sm:justify-between items-center gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              className="flex items-center gap-2 rounded-full"
              onClick={() => {
                setReminderDateForNote();
                openInGoogleCalendar();
              }}
            >
              <ExternalLink className="size-4" />
              Google Calendar
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 rounded-full shadow-none"
              onClick={(event) => {
                setReminderDateForNote();
                date && toast(`Scheduled for ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`)
                //saveCalendarInvite(event);
              }}
            >
              Select Date
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export default CalendarDialog;