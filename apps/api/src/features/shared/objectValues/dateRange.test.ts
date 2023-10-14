import { isGeneralError } from '#shared/errors/generalError.js';
import { unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

import { createDateRange, getDurationString } from './dateRange.js';

describe('UUT: Create date range', () => {
  describe('[GIVEN] start date is invalid', () => {
    describe('[WHEN] create a date range', () => {
      it('[THEN] it will return Left of error', () => {
        const startDate = new Date('???');
        const endDate = new Date('2022-11-12');

        const result = createDateRange(startDate, endDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
  describe('[GIVEN] end date is invalid', () => {
    describe('[WHEN] create a date range', () => {
      it('[THEN] it will return Left of error', () => {
        const startDate = new Date('2022-11-12');
        const endDate = new Date('???');

        const result = createDateRange(startDate, endDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
  describe('[GIVEN] start date is equal to end date', () => {
    describe('[WHEN] create a date range', () => {
      it('[THEN] it will return Right of date range', () => {
        const startDate = new Date('2022-11-12');
        const endDate = new Date('2022-11-12');

        const result = createDateRange(startDate, endDate);

        expect(result).toEqualRight({ start: startDate, end: endDate });
      });
    });
  });
  describe('[GIVEN] start date is before end date', () => {
    describe('[WHEN] create a date range', () => {
      it('[THEN] it will return Right of date range', () => {
        const startDate = new Date('2022-11-11');
        const endDate = new Date('2022-11-12');

        const result = createDateRange(startDate, endDate);

        expect(result).toEqualRight({ start: startDate, end: endDate });
      });
    });
  });
  describe('[GIVEN] start date is after end date', () => {
    describe('[WHEN] create a date range', () => {
      it('[THEN] it will return Left of error', () => {
        const startDate = new Date('2022-11-13');
        const endDate = new Date('2022-11-12');

        const result = createDateRange(startDate, endDate);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
});

describe('UUT: Get duration in human-readable string', () => {
  describe('[WHEN] get duration in human-readable string', () => {
    it('[THEN] it will return a duration in human-readable string', () => {
      const dateRange = unsafeUnwrapEitherRight(
        createDateRange(new Date('2011-10-01T12:10:01'), new Date('2011-10-05')),
      );

      const result = getDurationString(dateRange);

      expect(result).toBe('3 days 11 hours 49 minutes 59 seconds');
    });
  });
});
