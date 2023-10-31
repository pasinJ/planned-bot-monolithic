import { z } from 'zod';

import { replaceDateSchemaWithStringToDate } from './zod';

describe('UUT: Replace date schema with string to date', () => {
  describe('[GIVEN] the input schema is not date', () => {
    describe('[WHEN] replace date schema with string to date', () => {
      it('[THEN] it will return the original schema', () => {
        const schema = z.number();

        const result = replaceDateSchemaWithStringToDate(schema);

        expect(result).toEqual(schema);
      });
    });
  });
  describe('[GIVEN] the input schema is date', () => {
    describe('[WHEN] parse a date time string with the output schema', () => {
      it('[THEN] it will return correct date', () => {
        const schema = z.date();
        const stringDate = '2022-04-03T12:23:04.000Z';

        const result = replaceDateSchemaWithStringToDate(schema).parse(stringDate);

        expect(result).toEqual(new Date(stringDate));
      });
    });
  });
  describe('[GIVEN] the input schema is date array', () => {
    describe('[WHEN] parse a date time string array with the output schema', () => {
      it('[THEN] it will return correct date array', () => {
        const schema = z.date().array();
        const stringDate = ['2022-04-03T12:23:04.000Z', '2022-04-03T12:23:04.000Z'];

        const result = replaceDateSchemaWithStringToDate(schema).parse(stringDate);

        expect(result).toEqual(stringDate.map((val) => new Date(val)));
      });
    });
  });
  describe('[GIVEN] the input schema is an object with date property', () => {
    describe('[WHEN] parse that kind of object with the output schema', () => {
      it('[THEN] it will return correct parsed object', () => {
        const schema = z.object({ a: z.date(), x: z.number() });
        const input = { a: '2022-04-03T12:23:04.000Z', x: 1 };

        const result = replaceDateSchemaWithStringToDate(schema).parse(input);

        expect(result).toEqual({ a: new Date('2022-04-03T12:23:04.000Z'), x: 1 });
      });
    });
  });
  describe('[GIVEN] the input schema is an object with nested object with date property', () => {
    describe('[WHEN] parse that kind of object with the output schema', () => {
      it('[THEN] it will return correct parsed object', () => {
        const schema = z.object({ a: z.object({ b: z.date() }), x: z.number() });
        const input = { a: { b: '2022-04-03T12:23:04.000Z' }, x: 1 };

        const result = replaceDateSchemaWithStringToDate(schema).parse(input);

        expect(result).toEqual({ a: { b: new Date('2022-04-03T12:23:04.000Z') }, x: 1 });
      });
    });
  });
  describe('[GIVEN] the input schema is an array of object with date property', () => {
    describe('[WHEN] parse that kind of array with the output schema', () => {
      it('[THEN] it will return correct parsed array', () => {
        const schema = z.object({ a: z.date(), x: z.number() }).array();
        const input = [{ a: '2022-04-03T12:23:04.000Z', x: 1 }];

        const result = replaceDateSchemaWithStringToDate(schema).parse(input);

        expect(result).toEqual([{ a: new Date('2022-04-03T12:23:04.000Z'), x: 1 }]);
      });
    });
  });
  describe('[GIVEN] the input schema is discriminated union of object with date property', () => {
    describe('[WHEN] parse that kind of array with the output schema', () => {
      it('[THEN] it will return correct parsed array', () => {
        const schema = z.discriminatedUnion('type', [
          z.object({ type: z.literal('a'), a: z.date(), x: z.number() }),
          z.object({ type: z.literal('b'), b: z.date(), x: z.number() }),
        ]);
        const input = { type: 'a', a: '2022-04-03T12:23:04.000Z', x: 1 };

        const result = replaceDateSchemaWithStringToDate(schema).parse(input);

        expect(result).toEqual({ type: 'a', a: new Date('2022-04-03T12:23:04.000Z'), x: 1 });
      });
    });
  });
  describe('[GIVEN] the input schema has refinement', () => {
    describe('[WHEN] parse that kind of array with the output schema', () => {
      it('[THEN] it will return correct parsed array', () => {
        const schema = z.object({ a: z.date(), x: z.number() }).refine(() => true);
        const input = { a: '2022-04-03T12:23:04.000Z', x: 1 };

        const result = replaceDateSchemaWithStringToDate(schema).parse(input);

        expect(result).toEqual({ a: new Date('2022-04-03T12:23:04.000Z'), x: 1 });
      });
    });
  });
});
