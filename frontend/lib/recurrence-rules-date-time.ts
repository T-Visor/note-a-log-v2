// lib/recurrence-rules-date-time.ts
import { RRule } from "@spiandorello/rrulejs";

export type RecurrenceFrequency = "daily" | "weekdays" | "weekends" | "weekly" | "monthly" | "yearly";

/**
 * Ensure we have a proper RRule instance
 * Handles both RRule instances and plain objects from storage
 */
export const getValidRRule = (
  recurrenceRule: any // Use any to avoid type issues
): RRule | null => {
  if (!recurrenceRule) 
    return null;
  
  // If it's already an RRule instance, return it
  if (recurrenceRule instanceof RRule)
    return recurrenceRule;
  
  // If it's a plain object, try to create an RRule from it
  try {
    if (typeof recurrenceRule === 'object' && recurrenceRule !== null) {
      // IMPORTANT: Use the stored 'options' property if it exists
      const options = recurrenceRule.options || recurrenceRule.origOptions || recurrenceRule;
      return new RRule(options);
    }
  } 
  catch (error) {
    console.error('Failed to create RRule from stored data:', error);
  }
  
  return null;
};

export const dateMatchesRecurrenceRule = (
  iso8601Date: string,
  recurrenceRule: any
): boolean => {
  const rule = getValidRRule(recurrenceRule);
  if (!rule) return false;

  const dateOnly = iso8601Date.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (isNaN(utcDate.getTime()))
    throw new Error(`Invalid ISO date string: ${iso8601Date}`);

  return rule.between(utcDate, utcDate, true).length > 0;
};

export const getTodayOccurenceDateTime = (
  recurrenceRule: any,
  todayISO8601: string
): Date | null => {
  const rule = getValidRRule(recurrenceRule);
  if (!rule) return null;
  
  const todayDateTime = new Date(todayISO8601);
  const occurrences = rule.between(todayDateTime, todayDateTime, true);

  return occurrences.length > 0 ? occurrences[0] : null;
};

export const getRecurrenceRule = (
  date: Date,
  recurrenceFrequency: RecurrenceFrequency
): RRule | undefined => {
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

  return rule; // Return RRule instance, not string
};