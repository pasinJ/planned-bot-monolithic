import { generateArrayOf } from '#test-utils/faker/helper.js';
import { randomInt } from '#test-utils/faker/number.js';

import { buildTechnicalAnalysisModule } from './technicalAnalysis.js';

describe('UUT: Technical analysis module', () => {
  const taModule = buildTechnicalAnalysisModule();

  describe('UUT: Cross over function', () => {
    describe('[WHEN] check cross over with one of the parameter or both are arrays with length less than 2', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossover([1], generateArrayOf(randomInt))).toBeFalse();
        expect(taModule.crossover(generateArrayOf(randomInt), [1])).toBeFalse();
        expect(taModule.crossover([1], [1])).toBeFalse();
      });
    });

    describe('[WHEN] check cross under with one or both of the parameters have NaN as a value at the last 2 position', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossover([NaN, NaN, 3], [4, 3, 2])).toBeFalse();
        expect(taModule.crossover([1, 2, 3], [NaN, NaN, 2])).toBeFalse();
        expect(taModule.crossover([NaN, NaN, 3], [NaN, NaN, 2])).toBeFalse();
        expect(taModule.crossover([NaN, NaN, NaN], [NaN, NaN, 2])).toBeFalse();
        expect(taModule.crossover([NaN, NaN, 3], [NaN, NaN, NaN])).toBeFalse();
      });
    });

    describe('[WHEN] check cross over with the last value of the first array is less than the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossover([1, 2, 3], [3, 3, 4])).toBeFalse();
      });
    });

    describe('[WHEN] check cross over with the last value of the first array equals to the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossover([1, 2, 3], [3, 3, 3])).toBeFalse();
      });
    });

    describe('[WHEN] check cross over with the last value of the first array is greater than the last value of the second array, but the value before last value of the first array is also greater than the value before the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossover([1, 2, 3], [4, 1, 2])).toBeFalse();
      });
    });

    describe('[WHEN] check cross over with the last value of the first array is greater than the last value of the second array, and the value before last value of the first array is less than or equal to the value before the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossover([1, 2, 3], [4, 4, 2])).toBeTrue();
        expect(taModule.crossover([1, 2, 3], [3, 2, 2])).toBeTrue();
      });
    });
  });

  describe('UUT: Cross under function', () => {
    describe('[WHEN] check cross under with one or both of the parameters are arrays with length less than 2', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossunder([1], generateArrayOf(randomInt))).toBeFalse();
        expect(taModule.crossunder(generateArrayOf(randomInt), [1])).toBeFalse();
        expect(taModule.crossunder([1], [1])).toBeFalse();
      });
    });

    describe('[WHEN] check cross under with one or both of the parameters have NaN as a value at the last 2 position', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossunder([NaN, NaN, 2], [1, 2, 3])).toBeFalse();
        expect(taModule.crossunder([6, 5, 4], [NaN, NaN, 5])).toBeFalse();
        expect(taModule.crossunder([NaN, NaN, 4], [NaN, NaN, 5])).toBeFalse();
        expect(taModule.crossunder([NaN, NaN, NaN], [NaN, NaN, 5])).toBeFalse();
        expect(taModule.crossunder([NaN, NaN, 4], [NaN, NaN, NaN])).toBeFalse();
      });
    });

    describe('[WHEN] check cross under with the last value of the first array is greater than the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossunder([6, 5, 4], [1, 2, 3])).toBeFalse();
      });
    });

    describe('[WHEN] check cross under with the last value of the first array equals to the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossunder([6, 5, 4], [2, 3, 4])).toBeFalse();
      });
    });

    describe('[WHEN] check cross under with the last value of the first array is less than the last value of the second array, but the value before last value of the first array is also less than the value before the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossunder([6, 5, 4], [5, 6, 7])).toBeFalse();
      });
    });

    describe('[WHEN] check cross under with the last value of the first array is less than the last value of the second array, and the value before last value of the first array is also greater than or equal to the value before the last value of the second array', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.crossunder([6, 5, 4], [4, 5, 6])).toBeTrue();
      });
    });
  });

  describe('UUT: Falling', () => {
    describe('[WHEN] check failling with a array that has length less than period parameter', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.falling([3, 2, 1], 4)).toBeFalse();
      });
    });

    describe('[WHEN] check failling with a array that has non-NaN value less than period parameter', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.falling([NaN, NaN, 1], 2)).toBeFalse();
      });
    });

    describe("[WHEN] check failling with a array that has non-NaN value greater than or equal to period parameter [BUT] the last 'period' values of source do not continuously decrease", () => {
      it('[THEN] it will return false', () => {
        expect(taModule.falling([6, 5, 5, 4], 3)).toBeFalse();
        expect(taModule.falling([6, 5, 4, 4], 3)).toBeFalse();
        expect(taModule.falling([6, 5, 4, 5], 3)).toBeFalse();
        expect(taModule.falling([6, 3, 4, 2], 3)).toBeFalse();
      });
    });

    describe("[WHEN] check failling with a array that has non-NaN value greater than or equal to period parameter [AND] the last 'period' values of source continuously decrease", () => {
      it('[THEN] it will return false', () => {
        expect(taModule.falling([6, 5, 4, 3], 3)).toBeTrue();
        expect(taModule.falling([6, 6, 5, 4], 3)).toBeTrue();
        expect(taModule.falling([6, 6, 2, 1], 3)).toBeTrue();
      });
    });
  });

  describe('UUT: Rising', () => {
    describe('[WHEN] check rising with a array that has length less than period parameter', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.rising([1, 2, 3], 4)).toBeFalse();
      });
    });

    describe('[WHEN] check rising with a array that has non-NaN value less than period parameter', () => {
      it('[THEN] it will return false', () => {
        expect(taModule.rising([NaN, NaN, 1], 2)).toBeFalse();
      });
    });

    describe("[WHEN] check rising with a array that has non-NaN value greater than or equal to period parameter [BUT] the last 'period' values of source do not continuously increase", () => {
      it('[THEN] it will return false', () => {
        expect(taModule.rising([1, 2, 2, 3], 3)).toBeFalse();
        expect(taModule.rising([1, 2, 3, 3], 3)).toBeFalse();
        expect(taModule.rising([1, 2, 3, 2], 3)).toBeFalse();
        expect(taModule.rising([1, 2, 4, 3], 3)).toBeFalse();
      });
    });

    describe("[WHEN] check failling with a array that has non-NaN value greater than or equal to period parameter [AND] the last 'period' values of source continuously decrease", () => {
      it('[THEN] it will return false', () => {
        expect(taModule.rising([1, 1, 2, 3], 3)).toBeTrue();
        expect(taModule.rising([1, 0, 1, 2], 3)).toBeTrue();
        expect(taModule.rising([1, 3, 5, 7], 3)).toBeTrue();
      });
    });
  });

  describe('UUT: Get highest', () => {
    describe('[WHEN] get the highest value with an empty array', () => {
      it('[THEN] it will return undefined value', () => {
        expect(taModule.highest([], 3)).toBeUndefined();
      });
    });

    describe('[WHEN] get the highest value with an array that has length less than period parameter', () => {
      it('[THEN] it will correctly return the highest value of what we have', () => {
        expect(taModule.highest([1, 2, 3], 4)).toBe(3);
      });
    });

    describe('[WHEN] get the highest value with an array that has NaN value in the last period values', () => {
      it('[THEN] it will correctly return the highest value', () => {
        expect(taModule.highest([NaN, NaN, 3, 2], 4)).toBe(3);
      });
    });
  });

  describe('UUT: Get lowest', () => {
    describe('[WHEN] get the lowest value with an empty array', () => {
      it('[THEN] it will return undefined value', () => {
        expect(taModule.lowest([], 3)).toBeUndefined();
      });
    });

    describe('[WHEN] get the lowest value with an array that has length less than period parameter', () => {
      it('[THEN] it will correctly return the lowest value of what we have', () => {
        expect(taModule.lowest([1, 2, 3], 4)).toBe(1);
      });
    });

    describe('[WHEN] get the lowest value with an array that has NaN value in the last period values', () => {
      it('[THEN] it will correctly return the lowest value', () => {
        expect(taModule.lowest([NaN, NaN, 3, 2], 4)).toBe(2);
      });
    });
  });
});
