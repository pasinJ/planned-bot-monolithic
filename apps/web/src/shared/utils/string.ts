import { z } from 'zod';

export type DecimalString = string & z.BRAND<'DecimalString'>;
export type IntegerString = string & z.BRAND<'IntegerString'>;
export type HexColor = string & z.BRAND<'HexColor'>;
