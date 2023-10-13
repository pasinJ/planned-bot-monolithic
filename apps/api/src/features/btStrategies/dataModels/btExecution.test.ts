import { createDateRange } from '#features/shared/objectValues/dateRange.js';
import { ValidDate } from '#shared/utils/date.js';
import { unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

import { calculateProgressPercentage } from './btExecution.js';

describe('UUT: Calculate progress percentage', () => {
  describe('[GIVEN] processing date is before the start of date range', () => {
    describe('[WHEN] calculate progress percentage', () => {
      it('[THEN] it will return 0', () => {
        const btDateRange = unsafeUnwrapEitherRight(
          createDateRange(new Date('2020-10-10'), new Date('2020-10-15')),
        );
        const processingDate = new Date('2020-10-09') as ValidDate;

        const result = calculateProgressPercentage(btDateRange, processingDate);

        expect(result).toBe(0);
      });
    });
  });
  describe('[GIVEN] processing date is equal to the start of date range', () => {
    describe('[WHEN] calculate progress percentage', () => {
      it('[THEN] it will return 0', () => {
        const btDateRange = unsafeUnwrapEitherRight(
          createDateRange(new Date('2020-10-10'), new Date('2020-10-15')),
        );
        const processingDate = new Date('2020-10-10') as ValidDate;

        const result = calculateProgressPercentage(btDateRange, processingDate);

        expect(result).toBe(0);
      });
    });
  });
  describe('[GIVEN] processing date is equal to the end of date range', () => {
    describe('[WHEN] calculate progress percentage', () => {
      it('[THEN] it will return 100', () => {
        const btDateRange = unsafeUnwrapEitherRight(
          createDateRange(new Date('2020-10-10'), new Date('2020-10-15')),
        );
        const processingDate = new Date('2020-10-15') as ValidDate;

        const result = calculateProgressPercentage(btDateRange, processingDate);

        expect(result).toBe(100);
      });
    });
  });
  describe('[GIVEN] processing date is after the end of date range', () => {
    describe('[WHEN] calculate progress percentage', () => {
      it('[THEN] it will return 100', () => {
        const btDateRange = unsafeUnwrapEitherRight(
          createDateRange(new Date('2020-10-10'), new Date('2020-10-15')),
        );
        const processingDate = new Date('2020-10-16') as ValidDate;

        const result = calculateProgressPercentage(btDateRange, processingDate);

        expect(result).toBe(100);
      });
    });
  });
  describe('[GIVEN] processing date is equal to both the start and end of date range', () => {
    describe('[WHEN] calculate progress percentage', () => {
      it('[THEN] it will return 100', () => {
        const btDateRange = unsafeUnwrapEitherRight(
          createDateRange(new Date('2020-10-10'), new Date('2020-10-10')),
        );
        const processingDate = new Date('2020-10-10') as ValidDate;

        const result = calculateProgressPercentage(btDateRange, processingDate);

        expect(result).toBe(100);
      });
    });
  });
  describe('[GIVEN] processing date is between the start and end of date range', () => {
    describe('[WHEN] calculate progress percentage', () => {
      it('[THEN] it will return value between 0 to 100 based on progress', () => {
        const btDateRange = unsafeUnwrapEitherRight(
          createDateRange(new Date('2020-10-10'), new Date('2020-10-12')),
        );
        const processingDate = new Date('2020-10-11') as ValidDate;

        const result = calculateProgressPercentage(btDateRange, processingDate);

        expect(result).toBe(50);
      });
    });
  });
});
