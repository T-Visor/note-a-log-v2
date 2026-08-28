import { RRule } from '@spiandorello/rrulejs';

// Create a weekly recurrence rule (every Thursday starting Jan 1, 2026)
const rule = new RRule({
  freq: RRule.WEEKLY,
  dtstart: new Date(Date.UTC(2026, 0, 1)),  // Jan 1, 2026
  byweekday: [RRule.TH],                    // Use RRule.TH for Thursday
});

// Check if a Thursday is a recurrence
const thursday = new Date(Date.UTC(2026, 0, 8)); // Jan 8, 2026 (Thursday)
const thursdayResult = rule.between(thursday, thursday, true);
console.log('Thursday check:', thursdayResult.length > 0 ? 'MATCH' : 'NO MATCH');

// Check if a Friday is a recurrence
const friday = new Date(Date.UTC(2026, 0, 9)); // Jan 9, 2026 (Friday)
const fridayResult = rule.between(friday, friday, true);
console.log('Friday check:', fridayResult.length > 0 ? 'MATCH' : 'NO MATCH');

// Check a more complex case - 2nd Tuesday of each month
const complexRule = new RRule({
  freq: RRule.MONTHLY,
  byweekday: [RRule.TU], // Use RRule.TU for Tuesday
  bysetpos: [2],
  dtstart: new Date(Date.UTC(2026, 0, 1)),
});

const secondTuesday = new Date(Date.UTC(2026, 1, 10)); // Feb 10, 2026 (2nd Tuesday)
const complexResult = complexRule.between(secondTuesday, secondTuesday, true);
console.log('2nd Tuesday check:', complexResult.length > 0 ? 'MATCH' : 'NO MATCH');

// Check a non-matching date
const notSecondTuesday = new Date(Date.UTC(2026, 1, 3)); // Feb 3, 2026 (1st Tuesday)
const notResult = complexRule.between(notSecondTuesday, notSecondTuesday, true);
console.log('1st Tuesday check:', notResult.length > 0 ? 'MATCH' : 'NO MATCH');

// Bonus: Get all Thursdays in 2026
const startDate = new Date(Date.UTC(2026, 0, 1));
const endDate = new Date(Date.UTC(2026, 11, 31));
const allThursdays = rule.between(startDate, endDate, true);
console.log(`There are ${allThursdays.length} Thursdays in 2026`);
