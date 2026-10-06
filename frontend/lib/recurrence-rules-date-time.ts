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
  // Guard clause against invalid/missing string input
  if (!recurrenceRuleString || typeof recurrenceRuleString !== "string") {
    return false;
  }

  // Beginning of day: 12:00:00 am midnight
  const dateStart = new Date(iso8601Date);
  dateStart.setHours(0, 0, 0, 0); 

  // End of day: 11:59:59 pm
  const dateEnd = new Date(iso8601Date);
  dateEnd.setHours(23, 59, 59, 999);

  // Parse RRULE (ignoring DTSTART time offset if present)
  const rrule = rrulestr(recurrenceRuleString);

  // Check if any occurrence lands anywhere inside the target day
  return rrule.between(dateStart, dateEnd, true).length > 0;
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

  // Beginning of today: 12:00:00 am midnight
  const todayStart = new Date(todayISO8601);
  todayStart.setHours(0, 0, 0, 0); 

  // End of today: 11:59:59 pm
  const todayEnd = new Date(todayISO8601);
  todayEnd.setHours(23, 59, 59, 999);

  // Parse RRULE (ignoring DTSTART time offset if present)
  const rrule = rrulestr(recurrenceRuleString);

  // Find the matching occurence for today or 'null' otherwise
  const occurrences = rrule.between(todayStart, todayEnd, true);
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
  const dateStart = new Date(date);
  dateStart.setHours(hours, minutes, 0, 0);

  const baseOptions = {
    dtstart: dateStart
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