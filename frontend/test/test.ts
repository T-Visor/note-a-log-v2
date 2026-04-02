import { parseDate } from "chrono-node";
import { format } from "date-fns";

// Parse text and return a Date object relative to now
const now = new Date(); 
const date = parseDate("next friday at 7pm", now);

console.log(format(date!, "MM-dd-yyyy HH:mm:ss"));