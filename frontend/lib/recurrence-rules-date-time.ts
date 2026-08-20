import { RRule } from "@spiandorello/rrulejs";

export type RecurrenceFrequency = "daily" | "weekdays" | "weekends" | "weekly" | "monthly" | "yearly";

/**
 * Checks if a given date (ignoring time) matches an RRule recurrence.
 * 
 * ISO 8601 date string example: "2026-08-18T15:30:00Z"
 */
export const dateMatchesRecurrenceRule = (
    iso8601Date: string, 
    recurrenceRule: RRule
): boolean => {
    const dateOnly = iso8601Date.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    
    if (isNaN(utcDate.getTime()))
        throw new Error(`Invalid ISO date string: ${iso8601Date}`);
    
    return recurrenceRule.between(utcDate, utcDate, true).length > 0;
};

/**
 * Get today's occurence date-time from RRule.
 */
export const getTodayOccurenceDateTime = (
    recurrenceRule: RRule, 
    todayISO8601: string
): Date | null => {
    const todayDateTime = new Date(todayISO8601);
    const occurrences = recurrenceRule.between(todayDateTime, todayDateTime, true);

    if (occurrences.length > 0) 
        return occurrences[0];
    else 
        return null;
};

  const getRecurrenceRule = (
    date: Date, 
    recurrenceFrequency: RecurrenceFrequency
    ): RRule | undefined => {
    if (!date || !recurrenceFrequency)
      return;

    const baseOptions = {
      dtstart: new Date(date)
    };

    switch (recurrenceFrequency) {
      case "daily":
        return new RRule({
          ...baseOptions,
          freq: RRule.DAILY
        });
      case "weekdays":
        return new RRule({
          ...baseOptions,
          freq: RRule.WEEKLY,
          byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR]
        });
      case "weekends":
        return new RRule({
          ...baseOptions,
          freq: RRule.WEEKLY,
          byweekday: [RRule.SU, RRule.SA]
        });
      case "weekly":
        return new RRule({
          ...baseOptions,
          freq: RRule.WEEKLY
        });
      case "monthly":
        return new RRule({
          ...baseOptions,
          freq: RRule.MONTHLY
        })
      case "yearly":
        return new RRule({
          ...baseOptions,
          freq: RRule.YEARLY
        });
    };
  };