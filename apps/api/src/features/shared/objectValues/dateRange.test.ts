import { isGeneralError } from '#shared/errors/generalError.js';

import { createDateRange } from './dateRange.js';

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
