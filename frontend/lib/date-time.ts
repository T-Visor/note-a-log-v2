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