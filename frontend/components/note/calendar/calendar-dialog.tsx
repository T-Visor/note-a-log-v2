"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { addDays } from "date-fns";
import useNotesStore from "@/stores/useNotesStore";

const CalendarDialog = () => {
  const { currentNote } = useNotesStore();
  const [dialogOpen, setDialogOpen] = useState(false);

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
                defaultValue={currentNote?.title}
                placeholder="Title"
                className="flex-wrap bg-transparent h-auto border-0 !text-2xl font-bold tracking-tight shadow-none"
              />
            </Field>
          </FieldGroup>
          <CalendarWithPresets />
          <DialogFooter className="flex !justify-start items-center">
            <Button type="submit">Export</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
};

// Source - https://stackoverflow.com/q/71936557
// Posted by user17952840, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-16, License - CC BY-SA 4.0

export const saveCallInvite = (event: any) => {
  const newEvent = { ...event, address: event?.event_url ? event?.event_url : `${event?.address?.line_1} ${event?.address?.line_2}, ${event?.address?.city} ${event?.address?.state}, ${event?.address?.country} ${event?.address?.postal_code} ` }
  // Create the .ics URL
  let url = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "DTSTART:" + newEvent.date,
    "DTEND:",
    "SUMMARY:" + newEvent.name,
    "DESCRIPTION:" + newEvent.description,
    "LOCATION:" + newEvent.address,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "REPEAT:1",
    "DURATION:PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");

  let blob = new Blob([url], { type: 'text/calendar;charset=utf-8' });

  window.open(encodeURI("data:text/calendar;charset=utf8," + url));
};

export function CalendarWithPresets() {
  const [date, setDate] = React.useState<Date | undefined>(
    new Date()
  );
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  return (
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
};

export default CalendarDialog;