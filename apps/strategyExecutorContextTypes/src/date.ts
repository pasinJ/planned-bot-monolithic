import { z } from "zod";

export type ValidDate = Date & z.BRAND<"ValidDate">;
export type UnixMs = number & z.BRAND<"UnixMs">;
export type Day = Range<1, 32> & z.BRAND<"Day">;
export type Month = Range<1, 13> & z.BRAND<"Month">;
export type Year = number & z.BRAND<"Year">;
export type WeekOfYear = Range<1, 54> & z.BRAND<"WeekOfYear">;
export type Hour = Range<0, 24> & z.BRAND<"Hour">;
export type Minute = Range<0, 60> & z.BRAND<"Minute">;
export type Second = Range<0, 60> & z.BRAND<"Second">;
export type DayOfWeekString =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

type Range<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;
type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;
