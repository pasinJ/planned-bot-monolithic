import { z } from 'zod';

export type ValidDate = Date & z.BRAND<'ValidDate'>;
