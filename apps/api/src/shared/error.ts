import { append, is } from 'ramda';
import { CustomError } from 'ts-custom-error';

type Cause = Error | string;
type Constructor<T> = new (...args: never[]) => T;
type ArrayType<T extends unknown[]> = T extends (infer U)[] ? U : never;

export class ErrorBase<N extends string = string> extends CustomError {
  name: N;

  constructor(name: N, message: string, cause?: Cause) {
    super(message, cause ? { cause } : {});
    this.name = name;
  }

  public causedBy(cause: Cause): this {
    this.cause = cause;
    return this;
  }

  public getCausesList(): string[] {
    const getCausesListLoop = ({ cause }: Error, causeList: string[]): string[] => {
      if (cause instanceof Error) return getCausesListLoop(cause, append(getErrorSummary(cause), causeList));
      else if (is(String, cause)) return append(cause, causeList);
      else return causeList;
    };

    return getCausesListLoop(this, []);
  }

  public isCausedBy(errorNameOrString: string): boolean {
    const isCausedByLoop = (cause: unknown): boolean => {
      if (is(String, cause)) return cause === errorNameOrString;
      else if (cause instanceof Error && cause.name === errorNameOrString) return true;
      else if (cause instanceof Error && cause.name !== errorNameOrString) return isCausedByLoop(cause.cause);
      else return false;
    };

    return isCausedByLoop(this.cause);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      causes: this.getCausesList(),
    };
  }
}

export function createErrorFromUnknown<E extends ErrorBase<Names>, Name extends Names, Names extends string>(
  constructor: new (name: Name, message: string, cause?: Cause) => E,
  name: Name,
  message?: string,
) {
  return (unknown: unknown): E => {
    if (is(String, unknown)) return new constructor(name, unknown);
    else if (unknown instanceof Error)
      return new constructor(name, message ?? getErrorSummary(unknown), unknown);
    else return new constructor(name, message ?? 'Undefined message (created from unknown)');
  };
}

export function matchError<T extends Constructor<Error>[]>(...types: T) {
  return (unknown: unknown): unknown is InstanceType<ArrayType<T>> =>
    types.some((type) => unknown instanceof type);
}

export function getErrorSummary(error: Error): string {
  return `[${error.name}] ${error.message}`;
}
