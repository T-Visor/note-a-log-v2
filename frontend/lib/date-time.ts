import { format, differenceInCalendarDays } from "date-fns";

export const isToday = (date: string): boolean => {
  if (!date)
    return false;

  const today = new Date();
  const dateToCompare = new Date(date);

  return (
    dateToCompare.getFullYear() === today.getFullYear() &&
    dateToCompare.getMonth() === today.getMonth() &&
    dateToCompare.getDate() === today.getDate()
  );
};

export const isOverdue = (date: string): boolean => {
  if (!date)
    return false;

  const today = new Date();
  const dateToCompare = new Date(date);

  return dateToCompare < today;
};

export const howManyDaysAgo = (date: string): number | undefined => {
  if (!date)
    return;

  const today = new Date();
  const dateToCompare = new Date(date);

  return differenceInCalendarDays(today, dateToCompare);
};

export const howManyDaysAhead = (date: string): number | undefined => {
  if (!date)
    return;

  const today = new Date();
  const dateToCompare = new Date(date);

  return differenceInCalendarDays(dateToCompare, today);
};

export const getMonthDayYearFromDateString = (reminderDate: string) => {
  if (!reminderDate)
    return;

  const date = new Date(reminderDate);

  const month = date.toLocaleString("default", { month: "long" });
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();

  return `${month} ${dayOfMonth}, ${year}`;
};


export const getNextReminderForNote = (
  dates: string[]
): string | undefined => {
  // sort in ascending order
  const sortedDates = [...dates].sort((left, right) => +new Date(left) - +new Date(right));

  // Handle edge cases for empty or single-item arrays
  if (sortedDates.length === 0)
    return;
  if (sortedDates.length === 1)
    return sortedDates[0];

  // Find the first date that is today or in the future
  const nextDate = sortedDates.find(
    (date) => isToday(date) || howManyDaysAhead(date)! >= 1
  );

  // Return the found date, OR the last item if none were found (all in past)    
  return nextDate ?? sortedDates[sortedDates.length - 1];
};