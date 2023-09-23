import { z } from 'zod';

export type RemoveBrand<T> = Omit<T, typeof z.BRAND>;
export type RemoveBrandFromObjVal<T> = { [K in keyof T]: RemoveBrand<T[K]> };
