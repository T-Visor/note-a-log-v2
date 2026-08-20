import { RRule } from "@spiandorello/rrulejs";

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