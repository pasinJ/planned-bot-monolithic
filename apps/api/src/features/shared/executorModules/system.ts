export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type SymtemModule = {
  // client timezone
  getDate: () => Date;
  getUnixMsTime: () => number;
  getDay: () => number;
  getMonth: () => number;
  getYear: () => number;
  getDayOfWeek: () => DayOfWeek;
  getWeekOfYear: () => number;
  getHour: () => number;
  getMinute: () => number;
  getSecond: () => number;
};
