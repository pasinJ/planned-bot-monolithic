import { format, getWeek } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { ValidDate } from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';

import { SystemModuleDeps, buildSymtemModule } from './system.js';

function mockDeps(overrides?: DeepPartial<SystemModuleDeps>): SystemModuleDeps {
  return mergeDeepRight(
    { dateService: { getCurrentDate: () => new Date('2020-10-03') as ValidDate } },
    overrides ?? {},
  );
}

describe('UUT: System module', () => {
  const timezone = '-04:00' as TimezoneString;
  const currentDate = new Date('2020-10-02') as ValidDate;
  const localCurrentDate = utcToZonedTime(currentDate, timezone);
  const systemModule = buildSymtemModule(
    mockDeps({ dateService: { getCurrentDate: () => currentDate } }),
    timezone,
  );

  describe('[WHEN] get date', () => {
    it('[THEN] it will return the current date in the given timezone', () => {
      const result = systemModule.getDate();

      expect(result).toEqual(localCurrentDate);
    });
  });

  describe('[WHEN] get unix millisecond time', () => {
    it('[THEN] it will return the unix millisecond in the given timezone', () => {
      const result = systemModule.getUnixMsTime();

      expect(result).toEqual(localCurrentDate.getTime());
    });
  });

  describe('[WHEN] get day', () => {
    it('[THEN] it will return the day of month in the given timezone', () => {
      const result = systemModule.getDay();

      expect(result).toEqual(localCurrentDate.getDate());
    });
  });

  describe('[WHEN] get month', () => {
    it('[THEN] it will return the month in the given timezone', () => {
      const result = systemModule.getMonth();

      expect(result).toEqual(localCurrentDate.getMonth());
    });
  });

  describe('[WHEN] get year', () => {
    it('[THEN] it will return the year in the given timezone', () => {
      const result = systemModule.getYear();

      expect(result).toEqual(localCurrentDate.getFullYear());
    });
  });

  describe('[WHEN] get hour', () => {
    it('[THEN] it will return the hour in the given timezone', () => {
      const result = systemModule.getHours();

      expect(result).toEqual(localCurrentDate.getHours());
    });
  });

  describe('[WHEN] get minute', () => {
    it('[THEN] it will return the minute in the given timezone', () => {
      const result = systemModule.getMinutes();

      expect(result).toEqual(localCurrentDate.getMinutes());
    });
  });

  describe('[WHEN] get seconds', () => {
    it('[THEN] it will return the seconds in the given timezone', () => {
      const result = systemModule.getSeconds();

      expect(result).toEqual(localCurrentDate.getSeconds());
    });
  });

  describe('[WHEN] get day of week', () => {
    it('[THEN] it will return the day of week in the given timezone', () => {
      const result = systemModule.getDayOfWeek();

      expect(result).toEqual(format(localCurrentDate, 'eeee'));
    });
  });

  describe('[WHEN] get week of year', () => {
    it('[THEN] it will return the week of year in the given timezone', () => {
      const result = systemModule.getWeekOfYear();

      expect(result).toEqual(getWeek(localCurrentDate));
    });
  });
});
