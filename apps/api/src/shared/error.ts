import { append, is } from 'ramda';
import { CustomError as CustomErrorBase } from 'ts-custom-error';

export type GeneralCause = Error | string;
type Constructor<T> = new (...args: never[]) => T;
type ArrayType<T extends unknown[]> = T extends (infer U)[] ? U : never;

export class ErrorBase<
  Name extends string = 'ERROR_BASE',
  Cause extends GeneralCause = GeneralCause,
> extends CustomErrorBase {
  name: Name = 'ERROR_BASE' as Name;
  message = 'This is error base message';

  constructor(defaultVal: { name: Name; message: string }, nameOrMsg?: Name | string, msg?: string) {
    super();

    const name = msg ? (nameOrMsg as Name) : defaultVal.name;
    if (name) this.name = name;

    const message = msg ? msg : nameOrMsg ? nameOrMsg : defaultVal.message;
    if (message) this.message = message;
  }

  public causedBy(cause: Cause): this {
    super.cause = cause;
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

export function CustomError<Name extends string, Cause extends GeneralCause = GeneralCause>(
  defaultName: Name,
  defaultMessage: string,
) {
  return class extends ErrorBase<Name, Cause> {
    constructor(message?: string);
    constructor(name: Name, message: string);
    constructor(nameOrMsg?: Name | string, msg?: string) {
      super({ name: defaultName, message: defaultMessage }, nameOrMsg, msg);
    }
  };
}

type ExternalErrorName = 'EXTERNAL_ERROR';
export class ExternalError extends CustomError<ExternalErrorName>(
  'EXTERNAL_ERROR',
  'Error happened when try to use thrid-party library',
) {}

type IfIncludeExternalError<Cause extends GeneralCause, T> = ExternalError extends Cause ? T : never;

export function createErrorFromUnknown<
  E extends ErrorBase<Names, Cause>,
  Names extends string,
  Name extends Names,
  Cause extends ExternalError | GeneralCause,
>(
  constructor: new (nameOrMsg?: Name, msg?: string) => E,
  name?: IfIncludeExternalError<Cause, Name>,
  message?: IfIncludeExternalError<Cause, string>,
) {
  return (unknown: IfIncludeExternalError<Cause, unknown>): E => {
    if (is(String, unknown)) return new constructor(name, unknown);
    else if (unknown instanceof Error)
      return new constructor(name, message ?? getErrorSummary(unknown)).causedBy(
        new ExternalError().causedBy(unknown) as Cause,
      );
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

export function getErrorSummaryDeep(error: Error): string {
  return error instanceof ErrorBase ? error.getCausesList().join(' => ') : getErrorSummary(error);
}
