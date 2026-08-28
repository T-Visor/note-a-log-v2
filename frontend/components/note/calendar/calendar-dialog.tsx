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
import { CalendarCheck, CalendarClock, CalendarPlus, Download, ExternalLink, Pin, Plus, X, ChevronDownIcon } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import useNotesStore from "@/stores/useNotesStore";
import { isToday, howManyDaysAhead, getMonthDayYearFromDateString, getNextReminderForNote, isOverdue } from "@/lib/date-time";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RRule } from "@spiandorello/rrulejs";
import { RecurrenceFrequency, getRecurrenceRule } from "@/lib/recurrence-rules-date-time";

const CalendarDialog = () => {
  const { currentNote, updateNote } = useNotesStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarEventTitle, setCalendarEventTitle] = useState(currentNote?.title || "");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("09:00");
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [popOverOpen, setPopOverOpen] = useState(false);
  const [showOptionsForRecurring, setShowOptionsForRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("daily");

  const currentReminder = useMemo(() => {
    if (currentNote?.reminders)
      return getNextReminderForNote(currentNote?.reminders);
  }, [currentNote?.reminders]);

  useEffect(() => {
    setDate(new Date());
    setTime("09:00");
  }, [currentNote?.id]);

  useEffect(() => {
    setCalendarEventTitle(currentNote?.title || "");
  }, [currentNote?.id, currentNote?.title]);

  const setReminderDateForNote = () => {
    if (!date || !currentNote)
      return;

    const [hours, minutes] = time.split(":").map(Number);
    const dateWithTime = new Date(date);
    dateWithTime.setHours(hours, minutes);

    let reminders: string[] = currentNote?.reminders ?? [];

    reminders.push(dateWithTime.toISOString());
    updateNote(currentNote.id, {
      reminders: reminders
    });
  };

  const openInGoogleCalendar = () => {
    if (!date)
      return;

    const title = encodeURIComponent(calendarEventTitle);
    const noteUrl = encodeURIComponent(`${window.location.origin}/note/?id=${currentNote?.id}`);

    const startTime = time.split(":").join("") + "00"; // Example: converts 09:00 => 090000
    const dateOfReminder = format(date, "yyyyMMdd");

    const googleCalendarURL = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=Link+to+note:+${noteUrl}&dates=${dateOfReminder}T${startTime}`;
    window.open(googleCalendarURL, "_blank");
  };

  const CalendarWithPresets = () => (
    <>
      <Card className="border-0 shadow-none bg-transparent pt-2 pb-3">
        <CardContent>
          <FieldGroup className="flex flex-col justify-center items-start">
            <Field className="w-fit">
              <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
              <Popover open={popOverOpen} onOpenChange={setPopOverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date-picker-optional"
                    className="min-w-fit font-normal"
                  >
                    {date ? format(date, "PPP") : "Select date"}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    captionLayout="dropdown"
                    defaultMonth={date}
                    onSelect={(date) => {
                      setDate(date)
                      setPopOverOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Field className="w-fit">
              <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
              <Input
                type="time"
                id="time-picker-optional"
                step="60"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                onPointerDown={(event) => event.stopPropagation()}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </Field>
          </FieldGroup>
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
      <DialogContent
        className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-950 focus:outline-none"
        onInteractOutside={(event) => {
          if (popOverOpen) {
            event.preventDefault();
            setPopOverOpen(false);
          }
        }}
      >
        <DialogHeader className="py-1">
          <DialogTitle className="pb-2">Schedule Note</DialogTitle>
          {(currentNote?.reminders) && (
            <div className="min-h-0 shrink-0 max-h-30 overflow-y-auto flex flex-col gap-2 scrollbar-chrome-thin">
              {currentNote.reminders.toSorted((left, right) => +new Date(left) - +new Date(right))
                .sort((left, right) => (isToday(right) ? 1 : 0) - (isToday(left) ? 1 : 0)) // Bubbles today badge to the top for priority view in the dialog
                .map((reminder) => {
                  return (
                    <div className="flex justify-center items-center">
                      <span
                        className={`
                          flex justify-center items-center 
                          gap-1.5 px-2 py-0.5 rounded-md text-sm
                          hover:cursor-pointer hover:dark:bg-gray-800 hover:bg-gray-200
                          ${isOverdue(reminder) && "text-muted-foreground"}
                          ${isToday(reminder) ? "bg-blue-100 dark:bg-blue-900 font-bold" : "bg-gray-100 dark:bg-gray-900"}
                        `}
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
                })}
            </div>
          )}
          {
            currentNote?.recurrence?.recurrenceRule && (
              <span 
                className="flex justify-between items-center text-sm p-2 border bg-gray-900 rounded-md"
                onClick={() => {
                  updateNote(currentNote.id, {
                    recurrence: {
                      recurrenceRule: undefined
                    }
                  })
                }}
              >
                {currentNote.recurrence.recurrenceRule.toString()}
                <X className="!size-3"/>
              </span>
            )
          }
        </DialogHeader>
        <CalendarWithPresets />
        {!currentNote?.recurrence?.recurrenceRule && <div className={`flex items-center gap-2 px-6 ${!showOptionsForRecurring ? "pb-8" : ""}`}>
          <Switch
            id="airplane-mode"
            onClick={() => {
              setShowOptionsForRecurring(!showOptionsForRecurring);
            }}
          />
          <Label htmlFor="airplane-mode">Recurring</Label>
        </div>}
        {
          showOptionsForRecurring && !currentNote?.recurrence?.recurrenceRule && 
          <div className="pb-8 px-6">
            <hr className="border-t border my-4" />
            <Label className="pt-4">Recurrence Options</Label>
            <div className="flex flex-col items-start gap-2 pt-3">
              <Select
                value={recurrenceFrequency}
                onValueChange={(value) => {
                  setRecurrenceFrequency(value as RecurrenceFrequency);
                  console.log(value);
                }}
              >
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Frequency</SelectLabel>
                    <SelectItem value={"daily" as RecurrenceFrequency}>
                      Daily
                    </SelectItem>
                    <SelectItem value={"weekdays" as RecurrenceFrequency}>
                      Weekdays
                    </SelectItem>
                    <SelectItem value={"weekends" as RecurrenceFrequency}>
                      Weekends
                    </SelectItem>
                    <SelectItem value={"weekly" as RecurrenceFrequency}>
                      Weekly
                    </SelectItem>
                    <SelectItem value={"monthly" as RecurrenceFrequency}>
                      Monthly
                    </SelectItem>
                    <SelectItem value={"yearly" as RecurrenceFrequency}>
                      Yearly
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        <DialogFooter className="flex flex-row sm:justify-between items-center gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 rounded-full shadow-none"
              onClick={() => {
                if (!showOptionsForRecurring)
                  setReminderDateForNote();
                else {
                  if (date && currentNote) {
                    const recurrenceRule = getRecurrenceRule(date, recurrenceFrequency);
                    updateNote(currentNote.id, {
                      recurrence: {
                        recurrenceRule: recurrenceRule
                      }
                    });
                  }
                }
              }}
            >
              Confirm
            </Button>

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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export default CalendarDialog;