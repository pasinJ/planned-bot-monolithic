import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { execute as executeIO } from 'fp-ts-std/IO';
import * as io from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/function';

import { createMockLocalStorage } from '#test-utils/localStorage';
import { renderHookWithContexts } from '#test-utils/render';

import useLocalStorage from './useLocalStorage';

function renderUseLocalStorageHook(init?: string) {
  const localStorage = createMockLocalStorage();
  const eventEmitter = new EventTarget();
  const key = faker.word.noun();

  if (init) localStorage.setItem(key, init);

  return renderHookWithContexts(() => useLocalStorage({ key }), {
    infraContext: { localStorage, eventEmitter },
  });
}
function renderUseLocalStorageHookWithValue() {
  const value = faker.string.alphanumeric(5);
  return { ...renderUseLocalStorageHook(value), value };
}

describe('useLocalStorage hook', () => {
  describe('GIVEN local storage does not contain value of the given key WHEN get value', () => {
    it('THEN it should be None', () => {
      const { result } = renderUseLocalStorageHook();

      expect(result.current.get()).toBeNone();
    });
  });
  describe('GIVEN local storage contain value of the given key WHEN get the value', () => {
    it('THEN it should be Some of the value', () => {
      const { result, value } = renderUseLocalStorageHookWithValue();

      expect(result.current.get()).toEqualSome(value);
    });
  });

  describe('GIVEN the value has been changed to new value WHEN get new value', () => {
    it('THEN it should be Some of the new value', () => {
      const { result } = renderUseLocalStorageHookWithValue();
      const newValue = faker.string.alphanumeric();

      act(() => executeIO(result.current.set(newValue)));

      expect(result.current.get()).toEqualSome(newValue);
    });
  });

  describe('GIVEN the value has been remove WHEN get the value', () => {
    it('THEN it should be None', () => {
      const { result } = renderUseLocalStorageHookWithValue();

      act(() => executeIO(result.current.remove));

      expect(result.current.get()).toBeNone();
    });
  });

  describe('GIVEN listener has been subscribed to local storage', () => {
    it('WHEN set a new value THEN it should call the listener function', () => {
      const listener = jest.fn();
      const { result } = renderUseLocalStorageHook();

      executeIO(
        pipe(
          result.current.subscribe(listener),
          io.chain(() => result.current.set(faker.string.alphanumeric(5))),
        ),
      );

      expect(listener).toHaveBeenCalledOnce();
    });
    it('WHEN remove the value THEN it should call the listener function', () => {
      const listener = jest.fn();
      const { result } = renderUseLocalStorageHook();

      executeIO(
        pipe(
          result.current.subscribe(listener),
          io.chain(() => result.current.remove),
        ),
      );

      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('GIVEN listener has been subscribed to local storage and then unsubscribed', () => {
    it('WHEN set a new value THEN it should not call the listener function', () => {
      const listener = jest.fn();
      const { result } = renderUseLocalStorageHook();

      executeIO(
        pipe(
          result.current.subscribe(listener),
          io.chain(() => result.current.unsubscribe(listener)),
          io.chain(() => result.current.set(faker.string.alphanumeric(5))),
        ),
      );

      expect(listener).not.toHaveBeenCalled();
    });
    it('WHEN remove the value THEN it should not call the listener function', () => {
      const listener = jest.fn();
      const { result } = renderUseLocalStorageHook();

      executeIO(
        pipe(
          result.current.subscribe(listener),
          io.chain(() => result.current.unsubscribe(listener)),
          io.chain(() => result.current.remove),
        ),
      );

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
