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