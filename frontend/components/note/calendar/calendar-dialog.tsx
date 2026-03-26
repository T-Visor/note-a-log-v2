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
import { CalendarClock, Download, ExternalLink, Pin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { addDays, format } from "date-fns";
import useNotesStore from "@/stores/useNotesStore";
import { toast } from "sonner";

const CalendarDialog = () => {
  const { currentNote, updateNote } = useNotesStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarEventTitle, setCalendarEventTitle] = useState(currentNote?.title || "");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  useEffect(() => {
    setCalendarEventTitle(currentNote?.title || "");
  }, [currentNote?.id, currentNote?.title]);

  const setReminderDateForNote = () => {
    if (date && currentNote) {
      updateNote(currentNote.id, {
        reminderAt: date.toISOString()
      });
    }
  };

  const getPinnedDateMonthYearFromCurrentNote = () => {
    if (!currentNote?.reminderAt)
      return;

    const date = new Date(currentNote?.reminderAt);

    const month = date.toLocaleString("default", { month: "long" });
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    return `${month} ${dayOfMonth}, ${year}`;
  };

  const isPinnedDateFromCurrentNoteAfterToday = (): boolean => {
    if (!currentNote?.reminderAt)
      return false;

    const now = new Date();
    const pinnedDate = new Date(currentNote.reminderAt);

    return pinnedDate > now;
  }

  const isPinnedDateFromCurrentNoteToday = (): boolean => {
    if (!currentNote?.reminderAt)
      return false;

    const today = new Date();
    const dateToCompare = new Date(currentNote.reminderAt);

    return (
      dateToCompare.getFullYear() === today.getFullYear() &&
      dateToCompare.getMonth() === today.getMonth() &&
      dateToCompare.getDate() === today.getDate()
    );
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
        <CardFooter className="flex flex-wrap gap-2">
          {
            [
              { label: "Today", value: 0 },
              { label: "Tomorrow", value: 1 },
              { label: "2 days", value: 2 },
              { label: "1 week", value: 7 },
              { label: "2 weeks", value: 14 },
            ].map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                className="flex-1 rounded-full max-w-fit"
                onClick={(event) => {
                  event.preventDefault();
                  const newDate = addDays(new Date(), preset.value)
                  setDate(newDate)
                  setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1))
                }}
              >
                {preset.label}
              </Button>
            ))}
        </CardFooter>
      </Card>
    </>
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {
          (currentNote?.reminderAt && isPinnedDateFromCurrentNoteAfterToday())
            ?
            <Button variant="outline" className="flex items-center gap-1.5 rounded-full shadow-none">
              <CalendarClock className="size-4" />
              <span className="tabular-nums">{format(new Date(currentNote.reminderAt), "MMM dd")}</span>
            </Button>
            :
            (isPinnedDateFromCurrentNoteToday()
              ?
              <Button variant="outline" className="flex items-center gap-1.5 rounded-full shadow-none">
                <CalendarClock className="size-4" />
                <span>Today</span>
              </Button>
              :
              <Button variant="ghost" className="rounded-full">
                <CalendarClock className="size-5" />
              </Button>
            )
        }
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-950 focus:outline-none">
        <DialogHeader className="py-1">
          <DialogTitle className="pb-2">Pin to Calendar</DialogTitle>
          {(currentNote?.reminderAt && !isPinnedDateFromCurrentNoteAfterToday()) ? (
            isPinnedDateFromCurrentNoteToday()
            &&
            <div className="flex justify-center items-center">
              <span
                className="flex justify-center items-center text-sm gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-900 hover:cursor-pointer"
                onClick={() => {
                  updateNote(currentNote.id, {
                    reminderAt: undefined
                  })
                }}
              >
                Today
                <X className="!size-3" />
              </span>
            </div>
          )
            :
            (currentNote?.reminderAt && <div className="flex justify-center items-center">
              <span
                className="flex justify-center items-center text-sm gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-900 hover:cursor-pointer"
                onClick={() => {
                  updateNote(currentNote.id, {
                    reminderAt: undefined
                  })
                }}
              >
                {getPinnedDateMonthYearFromCurrentNote()}
                <X className="!size-3" />
              </span>
            </div>)
          }
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
              className="flex items-center gap-2 rounded-full"
              onClick={(event) => {
                setReminderDateForNote();
                date && toast(`Pinned for ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`)
                //saveCalendarInvite(event);
              }}
            >
              <Pin className="size-4" />
              Pin
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export default CalendarDialog;