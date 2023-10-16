import {
  ValidDate,
  UnixMs,
  Month,
  Year,
  Hour,
  Minute,
  Second,
  DayOfWeekString,
  WeekOfYear,
  Day,
} from "./date.js";

// in client timezone
export type SystemModule = Readonly<{
  getDate: () => ValidDate;
  getUnixMsTime: () => UnixMs;
  getDay: () => Day;
  getMonth: () => Month;
  getYear: () => Year;
  getHours: () => Hour;
  getMinutes: () => Minute;
  getSeconds: () => Second;
  getDayOfWeek: () => DayOfWeekString;
  getWeekOfYear: () => WeekOfYear;
}>;
