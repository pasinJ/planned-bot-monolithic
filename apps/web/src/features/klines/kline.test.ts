import { TimezoneString } from '#shared/utils/string';
import { mockKline } from '#test-utils/features/klines/kline';

import { formatKlineTimestamps } from './kline';

describe('UUT: Format kline timestamps', () => {
  describe('[WHEN] format timestamps to UTC timezone', () => {
    it('[THEN] it will return unchanged kline', () => {
      const kline = mockKline();
      const timezone = 'UTC' as TimezoneString;

      const result = formatKlineTimestamps(kline, timezone);

      expect(result).toEqual(kline);
    });
  });
  describe('[WHEN] format timestamps to +03:00 timezone', () => {
    it('[THEN] it will return kline with changed openTimestamp and closeTimestamp', () => {
      const kline = mockKline({
        openTimestamp: new Date('2022-10-02'),
        closeTimestamp: new Date('2022-10-03'),
      });
      const timezone = '+07:00' as TimezoneString;

      const result = formatKlineTimestamps(kline, timezone);

      expect(result).toEqual({
        ...kline,
        openTimestamp: new Date('2022-10-02T07:00:00.000Z'),
        closeTimestamp: new Date('2022-10-03T07:00:00.000Z'),
      });
    });
  });
});
