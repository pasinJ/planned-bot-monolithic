import { AssetPrecisionNumber, roundAsset } from './symbol.js';

describe('UUT: Round asset', () => {
  describe('[GIVEN] the input has decimal digit more than base asset precision number', () => {
    describe('[WHEN] round base asset', () => {
      it('[THEN] it will return a rounded value of input to base asset precision digit number', () => {
        const result = roundAsset(1.01, 1 as AssetPrecisionNumber);

        expect(result).toBe(1);
      });
    });
  });
  describe('[GIVEN] the input has decimal digit less than or equal to base asset precision number', () => {
    describe('[WHEN] round base asset', () => {
      it('[THEN] it will return unchanged value', () => {
        const result = roundAsset(1.01, 2 as AssetPrecisionNumber);

        expect(result).toBe(1.01);
      });
    });
  });
});
