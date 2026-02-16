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
import { Label } from "@/components/ui/label";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { addDays } from "date-fns";
import useNotesStore from "@/stores/useNotesStore";

const CalendarDialog = () => {
  const { currentNote } = useNotesStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarEventTitle, setCalendarEventTitle] = useState(currentNote?.title || "");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const saveCalendarInvite = () => {
    if (!date)
      return;

    // 1. Helper for All-Day DATE format (YYYYMMDD)
    const formatICSAllDay = (d: Date) => {
      return d.toISOString().split('T')[0].replace(/-/g, "");
    };

    // 2. Helper for DTSTAMP (Standard DATE-TIME format)
    const formatICSDateTime = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const title = calendarEventTitle;
    const noteUrl = `${window.location.origin}/?id=${currentNote?.id}`;

    const now = formatICSDateTime(new Date());

    // 3. Logic for All-Day: Start today, End tomorrow
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    const startStr = formatICSAllDay(startDate);
    const endStr = formatICSAllDay(endDate);

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Note-a-log//NONSGML v1.0//EN",
      "BEGIN:VEVENT",
      `UID:${currentNote?.id}-${Date.now()}`,
      `DTSTAMP:${now}`,
      // Note the added ;VALUE=DATE here
      `DTSTART;VALUE=DATE:${startStr}`,
      `DTEND;VALUE=DATE:${endStr}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Link to note: ${noteUrl}`,
      `URL;VALUE=URI:${noteUrl}`,

      // --- 1 Day Before at 9:00 AM ---
      "BEGIN:VALARM",
      "TRIGGER:-PT15H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Tomorrow",
      "END:VALARM",

      // --- Day of Event at 9:00 AM ---
      "BEGIN:VALARM",
      "TRIGGER:PT9H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Today",
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
      <div className="flex justify-start items-center gap-2 px-3">
        <span className="font-bold">Due:</span>
        <div className="p-2 bg-gray-100 dark:bg-input/30 rounded-sm">
          {date ? date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : "Pick a date"}
        </div>
      </div>

      <Card
        className="
          flex-col justify-center items-center 
          mx-auto max-w-fit 
          border-0 
          shadow-none bg-transparent
        "
      >
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
            { label: "In 3 days", value: 3 },
            { label: "In a week", value: 7 },
            { label: "In 2 weeks", value: 14 },
          ].map((preset) => (
            <Button
              key={preset.value}
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const newDate = addDays(new Date(), preset.value)
                setDate(newDate)
                setCurrentMonth(
                  new Date(newDate.getFullYear(), newDate.getMonth(), 1)
                )
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
      <form>
        <DialogTrigger asChild>
          <Button variant="ghost" className="rounded-full">
            <CalendarPlus className="size-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="py-1">
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field>
              <Input
                id="name-1"
                name="name"
                defaultValue={calendarEventTitle}
                placeholder="Title"
                className="
                  flex-wrap 
                  h-auto 
                  border-0 
                  !text-2xl font-bold 
                  tracking-tight shadow-none
                  bg-transparent 
                "
                onChange={
                  event => setCalendarEventTitle(event.target.value)
                }
              />
            </Field>
          </FieldGroup>
          <CalendarWithPresets />
          <DialogFooter className="flex !justify-start items-center">
            <Button
              type="submit"
              onClick={() => saveCalendarInvite()}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
};

export default CalendarDialog;