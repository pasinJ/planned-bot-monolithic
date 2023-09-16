export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };
