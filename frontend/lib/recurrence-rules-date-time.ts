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
  // 1. Guard clause against invalid/missing string input
  if (!recurrenceRuleString || typeof recurrenceRuleString !== "string") {
    return false;
  }

  const dateOnly = iso8601Date.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  
  if (!year || !month || !day) {
    throw new Error(`Invalid ISO date string: ${iso8601Date}`);
  }

  // Define full-day window in UTC (00:00:00 to 23:59:59.999)
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  if (isNaN(dayStart.getTime())) {
    throw new Error(`Invalid ISO date string: ${iso8601Date}`);
  }

  // Parse RRULE (ignoring DTSTART time offset if present)
  const rrule = rrulestr(recurrenceRuleString);

  // Check if any occurrence lands anywhere inside the target day
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

  const dateOnly = todayISO8601.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  // Define full 24-hour UTC window for today
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  const rrule = rrulestr(recurrenceRuleString);
  const occurrences = rrule.between(dayStart, dayEnd, true);

  return occurrences.length > 0 ? occurrences[0] : null;
};

/**
 * Return the iCalendar RFC string
 */
export const getRecurrenceRule = (
  date: Date,
  recurrenceFrequency: RecurrenceFrequency
): string | undefined => {
  if (!date || !recurrenceFrequency) 
    return undefined;

  let rule: RRule | undefined;
  const baseOptions = {
    dtstart: new Date(date)
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