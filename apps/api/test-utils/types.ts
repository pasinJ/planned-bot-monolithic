import { z } from 'zod';

export type RemoveBrand<T> = { [k in keyof T]: Omit<T[k], typeof z.BRAND> };
