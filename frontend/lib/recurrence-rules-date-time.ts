// lib/recurrence-rules-date-time.ts
import { RRule } from "@spiandorello/rrulejs";

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
  const rrule = RRule.fromString(recurrenceRuleString);
  const dateOnly = iso8601Date.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (isNaN(utcDate.getTime()))
    throw new Error(`Invalid ISO date string: ${iso8601Date}`);

  return rrule.between(utcDate, utcDate, true).length > 0;
};

/**
 * Get today's occurence date-time from RRule.
 */
export const getTodayOccurenceDateTime = (
  recurrenceRuleString: string,
  todayISO8601: string
): Date | null => {
  const rrule = RRule.fromString(recurrenceRuleString);
  const todayDateTime = new Date(todayISO8601);

  const occurrences = rrule.between(todayDateTime, todayDateTime, true);

  if (occurrences.length > 0)
    return occurrences[0];
  else
    return null;
};

/**
 * Return the iCalendar RFC string
 */
export const getRecurrenceRule = (
  date: Date,
  recurrenceFrequency: RecurrenceFrequency
): string | undefined => {
  if (!date || !recurrenceFrequency) return;

  const baseOptions = {
    dtstart: new Date(date)
  };

  let rule: RRule | undefined;

  switch (recurrenceFrequency) {
    case "daily":
      rule = new RRule({ ...baseOptions, freq: RRule.DAILY });
      break;
    case "weekdays":
      rule = new RRule({ ...baseOptions, freq: RRule.WEEKLY, byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR] });
      break;
    case "weekends":
      rule = new RRule({ ...baseOptions, freq: RRule.WEEKLY, byweekday: [RRule.SU, RRule.SA] });
      break;
    case "weekly":
      rule = new RRule({ ...baseOptions, freq: RRule.WEEKLY });
      break;
    case "monthly":
      rule = new RRule({ ...baseOptions, freq: RRule.MONTHLY });
      break;
    case "yearly":
      rule = new RRule({ ...baseOptions, freq: RRule.YEARLY });
      break;
    default:
      return undefined;
  }

  return rule.toString();
};