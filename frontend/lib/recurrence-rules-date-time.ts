// lib/recurrence-rules-date-time.ts
import { RRule, rrulestr } from "@spiandorello/rrulejs";

export type RecurrenceFrequency = "daily" | "weekdays" | "weekends" | "weekly" | "monthly" | "yearly";

/**
 * Checks if a given date (ignoring time) matches an RRule recurrence.
 * 
 * ISO 8601 date string example: "2026-08-18T15:30:00Z"
 */
export const dateMatchesRecurrenceRule = (
  iso8601Date: string,
  recurrenceRuleString: string
): boolean => {
  if (!recurrenceRuleString || typeof recurrenceRuleString !== "string") {
    return false;
  }

  // Parse using local time boundaries
  const targetDate = new Date(iso8601Date);
  const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  const rrule = rrulestr(recurrenceRuleString);
  return rrule.between(dayStart, dayEnd, true).length > 0;
};

/**
 * Get today's occurence date-time from RRule.
 */
export const getTodayOccurenceDateTime = (
  recurrenceRuleString: string,
  todayISO8601: string
): Date | null => {
  if (!recurrenceRuleString || typeof recurrenceRuleString !== "string") {
    return null;
  }

  // Parse using local time instead of splitting UTC ISO string
  const today = new Date(todayISO8601);
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const rrule = rrulestr(recurrenceRuleString);
  const occurrences = rrule.between(dayStart, dayEnd, true);

  return occurrences.length > 0 ? occurrences[0] : null;
};

/**
 * Return the iCalendar RFC string
 */
export const getRecurrenceRule = (
  date: Date,
  time: string,
  recurrenceFrequency: RecurrenceFrequency
): string | undefined => {
  if (!date || !recurrenceFrequency) 
    return undefined;

  let rule: RRule | undefined;

  const [hours, minutes] = time.split(":").map(Number);
  const dtStart = new Date(date);
  dtStart.setHours(hours, minutes, 0, 0);

  const baseOptions = {
    dtstart: dtStart
  };

  switch (recurrenceFrequency) {
    case "daily":
      rule = new RRule({
        ...baseOptions,
        freq: RRule.DAILY
      });
      break;
    case "weekdays":
      rule = new RRule({
        ...baseOptions,
        freq: RRule.WEEKLY,
        byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR]
      });
      break;
    case "weekends":
      rule = new RRule({
        ...baseOptions,
        freq: RRule.WEEKLY,
        byweekday: [RRule.SU, RRule.SA]
      });
      break;
    case "weekly":
      rule = new RRule({
        ...baseOptions,
        freq: RRule.WEEKLY
      });
      break;
    case "monthly":
      rule = new RRule({
        ...baseOptions,
        freq: RRule.MONTHLY
      });
      break;
    case "yearly":
      rule = new RRule({
        ...baseOptions,
        freq: RRule.YEARLY
      });
      break;
    default:
      return undefined;
  }

  return rule.toString();
};