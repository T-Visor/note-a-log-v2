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
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CalendarPlus, Download, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { addDays, format } from "date-fns";
import useNotesStore from "@/stores/useNotesStore";

const CalendarDialog = () => {
  const { currentNote } = useNotesStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarEventTitle, setCalendarEventTitle] = useState(currentNote?.title || "");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  useEffect(() => {
    setCalendarEventTitle(currentNote?.title || "");
  }, [currentNote?.id]);

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

    const formatICSAllDay = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, "");
    const formatICSDateTime = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const title = calendarEventTitle;
    const noteUrl = `${window.location.origin}/note/?id=${currentNote?.id}`;
    const now = formatICSDateTime(new Date());

    const startDate = new Date(date);
    const endDate = addDays(startDate, 1);

    const startStr = formatICSAllDay(startDate);
    const endStr = formatICSAllDay(endDate);

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Note-a-log//NONSGML v1.0//EN",
      "BEGIN:VEVENT",
      `UID:${currentNote?.id}-${Date.now()}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startStr}`,
      `DTEND;VALUE=DATE:${endStr}`,
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
      {/*<div className="flex justify-center items-center gap-2">
        <div className="p-2 bg-gray-100 dark:bg-input/30 rounded-sm">
          {date ? date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : "Pick a date"}
        </div>
      </div>*/}

      <Card className="flex-col justify-center items-center mx-auto max-w-fit border-0 shadow-none bg-transparent">
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="p-0 [--cell-size:--spacing(9.5)]"
          />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {[
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
              onClick={(e) => {
                e.preventDefault();
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
        <Button variant="ghost" className="rounded-full">
          <CalendarPlus className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-fit sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-950 focus:outline-none">
        <DialogHeader className="py-1">
          <DialogTitle>Set Reminder</DialogTitle>
        </DialogHeader>
        
        <FieldGroup className="gap-4">
          <Field>
            <Input
              value={calendarEventTitle}
              placeholder="Title"
              className="flex-wrap h-auto border-0 !text-2xl font-bold tracking-tight shadow-none bg-transparent"
              onChange={event => setCalendarEventTitle(event.target.value)}
            />
          </Field>
        </FieldGroup>

        <CalendarWithPresets />

        <DialogFooter className="flex flex-row sm:justify-between items-center gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              className="flex items-center gap-2 rounded-full"
              onClick={openInGoogleCalendar}
            >
              <ExternalLink className="size-4" />
              Google Calendar
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 rounded-full"
              onClick={saveCalendarInvite}
            >
              <Download className="size-4"/>
              ICS
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export default CalendarDialog;