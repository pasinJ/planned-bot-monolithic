import { format, getWeek } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { last } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';

import { randomTimezone } from '#test-utils/faker/date.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockKline } from '#test-utils/features/btStrategies/models.js';

import { buildSymtemModule } from './system.js';

describe('UUT: System module', () => {
  const timezone = randomTimezone();
  const klines = generateArrayOf(mockKline);
  const systemModule = buildSymtemModule(timezone, klines);

  describe('[WHEN] get date', () => {
    it('[THEN] it will return the date of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getDate();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone);
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get unix millisecond time', () => {
    it('[THEN] it will return the unix millisecond of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getUnixMsTime();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone).getTime();
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get day', () => {
    it('[THEN] it will return the day of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getDay();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone).getDate();
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get month', () => {
    it('[THEN] it will return the month of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getMonth();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone).getMonth();
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get year', () => {
    it('[THEN] it will return the year of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getYear();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone).getFullYear();
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get hour', () => {
    it('[THEN] it will return the hour of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getHours();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone).getHours();
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get minute', () => {
    it('[THEN] it will return the minute of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getMinutes();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone).getMinutes();
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get seconds', () => {
    it('[THEN] it will return the seconds of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getSeconds();

      const expected = utcToZonedTime(last(klines).closeTimestamp, timezone).getSeconds();
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get day of week', () => {
    it('[THEN] it will return the day of week of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getDayOfWeek();

      const expected = format(utcToZonedTime(last(klines).closeTimestamp, timezone), 'eeee');
      expect(result).toEqual(expected);
    });
  });

  describe('[WHEN] get week of year', () => {
    it('[THEN] it will return the week of year of close timestamp of the last kline from array in given timezone', () => {
      const result = systemModule.getWeekOfYear();

      const expected = getWeek(utcToZonedTime(last(klines).closeTimestamp, timezone));
      expect(result).toEqual(expected);
    });
  });
});
