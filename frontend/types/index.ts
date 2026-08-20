import { Block } from "@blocknote/core";
import { RRule } from "@spiandorello/rrulejs";

export type RecurringDate = {
  recurrenceRule?: RRule;
  skipDate?: string; // ISO 8601
  /* These fields below may be implemented in the future, for an MVP we will stick with the ones above.
  skippedDates?: string[];    // ISO 8601 - multiple dates to skip (optional)
  nextOccurrence?: string;    // ISO 8601 - pre-computed next occurrence
  lastViewed?: string;        // ISO 8601 - when user last viewed/cleared it */
};

export interface Note {
  id: string;
  title: string;
  content: string;
  editorContent: Block[];
  tags: string[];
  location?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  reminderAt?: string;  // ISO 8601
  reminders?: string[];
  favorite?: boolean;
  recurrence?: RecurringDate;
}

export type Theme = "system" | "dark" | "light";