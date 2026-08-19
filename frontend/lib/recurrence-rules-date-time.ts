import { RRule } from "@spiandorello/rrulejs";

/**
 * Checks if a given date (ignoring time) matches an RRule recurrence
 * @param iso8601Date - ISO 8601 date string (e.g., "2026-08-18T15:30:00Z")
 */
const isDateRecurrence = (
    iso8601Date: string, 
    recurrenceRule: RRule
): boolean => {
    // Extract date portion and set time to midnight UTC
    const dateOnly = iso8601Date.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day)); // months are 0-indexed in Javascript Date
    
    // Validate the date was parsed correctly
    if (isNaN(utcDate.getTime()))
        throw new Error(`Invalid ISO date string: ${iso8601Date}`);
    
    return recurrenceRule.between(utcDate, utcDate, true).length > 0;
};

// Create a daily recurrence rule (every Thursday starting Jan 1, 2026)
const rule = new RRule({
  freq: RRule.WEEKLY,
  dtstart: new Date(Date.UTC(2026, 0, 1)),  // Jan 1, 2026
});

console.log(isDateRecurrence("2026-08-18T22:35:00.000Z", rule));