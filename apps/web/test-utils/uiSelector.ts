import {
  ByRoleMatcher,
  ByRoleOptions,
  Matcher,
  MatcherOptions,
  SelectorMatcherOptions,
  queries,
  screen,
  waitForOptions,
} from '@testing-library/react';

// Dependency conflict of testing-library-selector(^0.2.1) causes "Warning: An update to ForwardRef(TouchRipple) insmatchere a test was not wrapped in act(...)." error.
// Recreate the same functionality without the library.

type BoundAttribute = 'LabelText' | 'AltText' | 'DisplayValue' | 'TestId' | 'PlaceholderText' | 'Title';
type ScreenMethod = keyof typeof screen;
type ScreenQueryMethod = Extract<ScreenMethod, `get${string}` | `find${string}` | `query${string}`>;

type Selector<El extends HTMLElement = HTMLElement> = {
  readonly get: (container?: HTMLElement) => El;
  readonly getAll: (container?: HTMLElement) => readonly El[];
  readonly find: (container?: HTMLElement, waitForOptions?: waitForOptions) => Promise<El>;
  readonly findAll: (container?: HTMLElement, waitForOptions?: waitForOptions) => Promise<readonly El[]>;
  readonly query: (container?: HTMLElement) => El | null;
  readonly queryAll: (container?: HTMLElement) => readonly El[];
};

function selector<El extends HTMLElement = HTMLElement>(
  selection:
    | {
        readonly query: 'ByRole';
        readonly matcher: ByRoleMatcher;
        readonly options?: ByRoleOptions;
      }
    | {
        readonly query: 'ByText' | 'ByLabelText';
        readonly matcher: Matcher;
        readonly options?: SelectorMatcherOptions;
      }
    | {
        readonly query: 'ByBoundAttribute';
        readonly attribute: BoundAttribute;
        readonly matcher: Matcher;
        readonly options?: MatcherOptions;
      },
): Selector<El> {
  const exec = (
    type: 'get' | 'getAll' | 'find' | 'findAll' | 'query' | 'queryAll',
    waitForOptions?: waitForOptions,
    container?: HTMLElement,
  ): ReturnType<Selector[keyof Selector]> => {
    const methodName = `${type}${
      selection.query === 'ByBoundAttribute' ? `By${selection.attribute}` : selection.query
    }` as unknown as ScreenQueryMethod;
    const args: readonly unknown[] = [
      selection.matcher,
      selection.options,
      ...(waitForOptions ? [waitForOptions] : []),
    ];

    // @ts-expect-error We can ignore this type error
    if (container) return queries[methodName](container, ...args);
    // @ts-expect-error We can ignore this type error
    return screen[methodName](...args) as ReturnType<Selector[keyof Selector]>;
  };

  return {
    get: (container) => exec('get', undefined, container) as El,
    getAll: (container) => exec('getAll', undefined, container) as readonly El[],
    find: (container, waitForOptions) => exec('find', waitForOptions, container) as Promise<El>,
    findAll: (container, waitForOptions) =>
      exec('findAll', waitForOptions, container) as Promise<readonly El[]>,
    query: (container) => exec('query', undefined, container) as El | null,
    queryAll: (container) => exec('queryAll', undefined, container) as readonly El[],
  };
}

export function byRole<El extends HTMLElement = HTMLElement>(
  matcher: ByRoleMatcher,
  options?: ByRoleOptions,
): Selector<El> {
  return selector({ query: 'ByRole', matcher, options });
}

export function byText<El extends HTMLElement = HTMLElement>(
  matcher: Matcher,
  options?: SelectorMatcherOptions,
): Selector<El> {
  return selector({ query: 'ByText', matcher, options });
}

export function byBoundAttribute<El extends HTMLElement = HTMLElement>(
  attribute: BoundAttribute,
  matcher: Matcher,
  options?: MatcherOptions,
): Selector<El> {
  return selector({
    query: 'ByBoundAttribute',
    attribute,
    matcher,
    options,
  });
}

export function byLabelText<El extends HTMLElement = HTMLElement>(
  matcher: Matcher,
  options?: SelectorMatcherOptions,
): Selector<El> {
  return selector({ query: 'ByLabelText', matcher, options });
}

export function byAltText<El extends HTMLElement = HTMLElement>(
  matcher: Matcher,
  options?: MatcherOptions,
): Selector<El> {
  return byBoundAttribute<El>('AltText', matcher, options);
}

export function byDisplayValue<El extends HTMLElement = HTMLElement>(
  matcher: Matcher,
  options?: MatcherOptions,
): Selector<El> {
  return byBoundAttribute<El>('DisplayValue', matcher, options);
}

export function byTestId<El extends HTMLElement = HTMLElement>(
  matcher: Matcher,
  options?: MatcherOptions,
): Selector<El> {
  return byBoundAttribute<El>('TestId', matcher, options);
}

export function byPlaceholderText<El extends HTMLElement = HTMLElement>(
  matcher: Matcher,
  options?: MatcherOptions,
): Selector<El> {
  return byBoundAttribute<El>('PlaceholderText', matcher, options);
}

export function byTitle<El extends HTMLElement = HTMLElement>(
  matcher: Matcher,
  options?: MatcherOptions,
): Selector<El> {
  return byBoundAttribute<El>('Title', matcher, options);
}
