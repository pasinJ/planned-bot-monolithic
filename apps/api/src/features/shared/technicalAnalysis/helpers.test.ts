import { crossover, crossunder, falling, highest, lowest, rising } from './helpers.js';

describe('UUT: Cross over function', () => {
  describe('[GIVEN] one or both of the input arrays have length less than 2', () => {
    describe('[WHEN] check cross over', () => {
      it('[THEN] it will return false', () => {
        expect(crossover([1], [1, 2])).toBeFalse();
        expect(crossover([1, 2], [1])).toBeFalse();
        expect(crossover([1], [1])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] one or both of the input arrays contain NaN as a value at the last 2 position', () => {
    describe('[WHEN] check cross over', () => {
      it('[THEN] it will return false', () => {
        expect(crossover([NaN, NaN, 3], [4, 3, 2])).toBeFalse();
        expect(crossover([1, 2, 3], [NaN, NaN, 2])).toBeFalse();
        expect(crossover([NaN, NaN, 3], [NaN, NaN, 2])).toBeFalse();
        expect(crossover([NaN, NaN, NaN], [NaN, NaN, 2])).toBeFalse();
        expect(crossover([NaN, NaN, 3], [NaN, NaN, NaN])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the last value of the first array is less than the last value of the second array', () => {
    describe('[WHEN] check cross over', () => {
      it('[THEN] it will return false', () => {
        expect(crossover([1, 2, 3], [3, 3, 4])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the last value of the first array equals to the last value of the second array', () => {
    describe('[WHEN] check cross over', () => {
      it('[THEN] it will return false', () => {
        expect(crossover([1, 2, 3], [3, 3, 3])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the last value of the first array is greater than the last value of the second array [BUT] the value before last value of the first array is also greater than the value before the last value of the second array', () => {
    describe('[WHEN] check cross over', () => {
      it('[THEN] it will return false', () => {
        expect(crossover([1, 2, 3], [4, 1, 2])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the last value of the first array is greater than the last value of the second array [AND] the value before last value of the first array is less than or equal to the value before the last value of the second array', () => {
    describe('[WHEN] check cross over', () => {
      it('[THEN] it will return true', () => {
        expect(crossover([1, 2, 3], [4, 4, 2])).toBeTrue();
        expect(crossover([1, 2, 3], [3, 2, 2])).toBeTrue();
      });
    });
  });
});

describe('UUT: Cross under function', () => {
  describe('[GIVEN] one or both of the input arrays have length less than 2', () => {
    describe('[WHEN] check cross under', () => {
      it('[THEN] it will return false', () => {
        expect(crossunder([1], [1, 2])).toBeFalse();
        expect(crossunder([1, 2], [1])).toBeFalse();
        expect(crossunder([1], [1])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] one or both of the input arrays have NaN as a value at the last 2 position', () => {
    describe('[WHEN] check cross under', () => {
      it('[THEN] it will return false', () => {
        expect(crossunder([NaN, NaN, 2], [1, 2, 3])).toBeFalse();
        expect(crossunder([6, 5, 4], [NaN, NaN, 5])).toBeFalse();
        expect(crossunder([NaN, NaN, 4], [NaN, NaN, 5])).toBeFalse();
        expect(crossunder([NaN, NaN, NaN], [NaN, NaN, 5])).toBeFalse();
        expect(crossunder([NaN, NaN, 4], [NaN, NaN, NaN])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the last value of the first array is greater than or equal to the last value of the second array', () => {
    describe('[WHEN] check cross under', () => {
      it('[THEN] it will return false', () => {
        expect(crossunder([6, 5, 4], [1, 2, 3])).toBeFalse();
        expect(crossunder([6, 5, 4], [2, 3, 4])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the last value of the first array is less than the last value of the second array [BUT] the value before last value of the first array is also less than the value before the last value of the second array', () => {
    describe('[WHEN] check cross under', () => {
      it('[THEN] it will return false', () => {
        expect(crossunder([6, 5, 4], [5, 6, 7])).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the last value of the first array is less than the last value of the second array [AND] the value before last value of the first array is also greater than or equal to the value before the last value of the second array', () => {
    describe('[WHEN] check cross under', () => {
      it('[THEN] it will return true', () => {
        expect(crossunder([6, 5, 4], [4, 5, 6])).toBeTrue();
      });
    });
  });
});

describe('UUT: Falling', () => {
  describe('[GIVEN] the input array has length less than period parameter', () => {
    describe('[WHEN] check failling', () => {
      it('[THEN] it will return false', () => {
        expect(falling([3, 2, 1], 4)).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the input array has non-NaN value less than period parameter', () => {
    describe('[WHEN] check failling', () => {
      it('[THEN] it will return false', () => {
        expect(falling([NaN, NaN, 1], 2)).toBeFalse();
      });
    });
  });
  describe("[GIVEN] the input array has non-NaN value greater than or equal to period parameter [BUT] the last 'period' values of the array do not continuously decrease", () => {
    describe('[WHEN] check failling', () => {
      it('[THEN] it will return false', () => {
        expect(falling([6, 5, 5, 4], 3)).toBeFalse();
        expect(falling([6, 5, 4, 4], 3)).toBeFalse();
        expect(falling([6, 5, 4, 5], 3)).toBeFalse();
        expect(falling([6, 3, 4, 2], 3)).toBeFalse();
      });
    });
  });
  describe("[GIVEN] the input array has non-NaN value greater than or equal to period parameter [AND] the last 'period' values of source continuously decrease", () => {
    describe('[WHEN] check failling', () => {
      it('[THEN] it will return true', () => {
        expect(falling([6, 5, 4, 3], 3)).toBeTrue();
        expect(falling([6, 6, 5, 4], 3)).toBeTrue();
        expect(falling([6, 6, 2, 1], 3)).toBeTrue();
      });
    });
  });
});

describe('UUT: Rising', () => {
  describe('[GIVEN] the input array has length less than period parameter', () => {
    describe('[WHEN] check rising', () => {
      it('[THEN] it will return false', () => {
        expect(rising([1, 2, 3], 4)).toBeFalse();
      });
    });
  });
  describe('[GIVEN] the input array has non-NaN value less than period parameter', () => {
    describe('[WHEN] check rising', () => {
      it('[THEN] it will return false', () => {
        expect(rising([NaN, NaN, 1], 2)).toBeFalse();
      });
    });
  });
  describe("[GIVEN] the input array has non-NaN value greater than or equal to period parameter [BUT] the last 'period' values of source do not continuously increase", () => {
    describe('[WHEN] check rising', () => {
      it('[THEN] it will return false', () => {
        expect(rising([1, 2, 2, 3], 3)).toBeFalse();
        expect(rising([1, 2, 3, 3], 3)).toBeFalse();
        expect(rising([1, 2, 3, 2], 3)).toBeFalse();
        expect(rising([1, 2, 4, 3], 3)).toBeFalse();
      });
    });
  });
  describe("[GIVEN] the input array has non-NaN value greater than or equal to period parameter [AND] the last 'period' values of source continuously decrease", () => {
    describe('[WHEN] check failling', () => {
      it('[THEN] it will return true', () => {
        expect(rising([1, 1, 2, 3], 3)).toBeTrue();
        expect(rising([1, 0, 1, 2], 3)).toBeTrue();
        expect(rising([1, 3, 5, 7], 3)).toBeTrue();
      });
    });
  });
});

describe('UUT: Get highest', () => {
  describe('[GIVEN] the input array is empty', () => {
    describe('[WHEN] get the highest value', () => {
      it('[THEN] it will return undefined value', () => {
        expect(highest([], 3)).toBeUndefined();
      });
    });
  });
  describe('[GIVEN] the input array has length less than the period parameter', () => {
    describe('[WHEN] get the highest value', () => {
      it('[THEN] it will correctly return the highest value in the input array', () => {
        expect(highest([1, 2, 3], 4)).toBe(3);
      });
    });
  });
  describe('[GIVEN] the input array has length more than or equal to the period parameter', () => {
    describe('[WHEN] get the highest value', () => {
      it("[THEN] it will correctly return the highest value of the last 'period' value", () => {
        expect(highest([1, 2, 3, 6, 5, 4], 6)).toBe(6);
        expect(highest([2, 2, 3, 1, 5, 0], 1)).toBe(0);
      });
    });
  });
  describe("[GIVEN] the input array has NaN value in the last 'period' values", () => {
    describe('[WHEN] get the highest value', () => {
      it("[THEN] it will correctly return the highest value of the last 'period' value", () => {
        expect(highest([NaN, NaN, 3, 2], 4)).toBe(3);
      });
    });
  });
});

describe('UUT: Get lowest', () => {
  describe('[GIVEN] the input array is empty', () => {
    describe('[WHEN] get the lowest value', () => {
      it('[THEN] it will return undefined value', () => {
        expect(lowest([], 3)).toBeUndefined();
      });
    });
  });
  describe('[GIVEN] the input array has length less than the period parameter', () => {
    describe('[WHEN] get the lowest value', () => {
      it('[THEN] it will correctly return the lowest value of what we have', () => {
        expect(lowest([1, 2, 3], 4)).toBe(1);
      });
    });
  });
  describe('[GIVEN] the input array has length more than or equal to the period parameter', () => {
    describe('[WHEN] get the lowest value', () => {
      it("[THEN] it will correctly return the lowest value of the last 'period' value", () => {
        expect(lowest([1, 2, 3, 6, 5, 4], 6)).toBe(1);
        expect(lowest([2, 2, 3, 1, 5, 0], 3)).toBe(0);
      });
    });
  });
  describe("[GIVEN] the input array has NaN value in the last 'period' values", () => {
    describe('[WHEN] get the lowest value', () => {
      it('[THEN] it will correctly return the lowest value', () => {
        expect(lowest([NaN, NaN, 3, 2], 4)).toBe(2);
      });
    });
  });
});
