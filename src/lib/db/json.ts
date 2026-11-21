export type Jsonified<T> = T extends Date
  ? string
  : T extends object
    ? { [K in keyof T]: Jsonified<T[K]> }
    : T;

export const toJson = <T>(value: T) => JSON.parse(JSON.stringify(value)) as Jsonified<T>;
