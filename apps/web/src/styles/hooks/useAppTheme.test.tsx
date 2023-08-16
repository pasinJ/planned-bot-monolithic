import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { execute as executeIO } from 'fp-ts-std/IO';
import MatchMediaMock from 'jest-matchmedia-mock';
import { values } from 'ramda';

import { Theme, themeEnum } from '#styles/theme.schema';
import { createMockLocalStorage } from '#test-utils/localStorage';
import { renderHookWithContexts } from '#test-utils/render';

import useAppTheme from './useAppTheme';

function renderHookWithoutPreferScheme(init?: Theme) {
  const localStorage = createMockLocalStorage();
  const eventEmitter = new EventTarget();

  if (init) localStorage.setItem('theme', init);

  return renderHookWithContexts(useAppTheme, ['Infra'], { infraContext: { localStorage, eventEmitter } });
}
function renderHookWithPreferLight(init?: Theme) {
  matchMedia.useMediaQuery('(prefers-color-scheme: light)');
  return renderHookWithoutPreferScheme(init);
}
function renderHookWithPreferDark(init?: Theme) {
  matchMedia.useMediaQuery('(prefers-color-scheme: dark)');
  return renderHookWithoutPreferScheme(init);
}
function randomTheme() {
  return faker.helpers.arrayElement(values(themeEnum));
}

let matchMedia: MatchMediaMock;

beforeEach(() => {
  matchMedia = new MatchMediaMock();
});
afterEach(() => {
  matchMedia.destroy();
});

describe('useAppTheme hook', () => {
  describe('GIVEN local storage does not has theme value', () => {
    describe('GIVEN no preferred scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'light'", () => {
        const { result } = renderHookWithoutPreferScheme();
        expect(result.current.appTheme).toEqual(themeEnum.light);
      });
    });
    describe('GIVEN user preferred light scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'light'", () => {
        const { result } = renderHookWithPreferLight();
        expect(result.current.appTheme).toEqual(themeEnum.light);
      });
    });
    describe('GIVEN user preferred dark scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'dark'", () => {
        const { result } = renderHookWithPreferDark();
        expect(result.current.appTheme).toEqual(themeEnum.dark);
      });
    });
  });

  describe("GIVEN local storage has theme value equal to 'dark'", () => {
    describe('GIVEN no preferred scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'dark'", () => {
        const { result } = renderHookWithoutPreferScheme(themeEnum.dark);
        expect(result.current.appTheme).toEqual(themeEnum.dark);
      });
    });
    describe('GIVEN user preferred light scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'dark'", () => {
        const { result } = renderHookWithPreferLight(themeEnum.dark);
        expect(result.current.appTheme).toEqual(themeEnum.dark);
      });
    });
    describe('GIVEN user preferred dark scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'dark'", () => {
        const { result } = renderHookWithPreferDark(themeEnum.dark);
        expect(result.current.appTheme).toEqual(themeEnum.dark);
      });
    });
  });

  describe("GIVEN local storage has theme value equal to 'light'", () => {
    describe('GIVEN no preferred scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'light'", () => {
        const { result } = renderHookWithoutPreferScheme(themeEnum.light);
        expect(result.current.appTheme).toEqual(themeEnum.light);
      });
    });
    describe('GIVEN user preferred light scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'light'", () => {
        const { result } = renderHookWithPreferLight(themeEnum.light);
        expect(result.current.appTheme).toEqual(themeEnum.light);
      });
    });
    describe('GIVEN user preferred dark scheme WHEN call the hook', () => {
      it("THEN it should return theme equals 'light'", () => {
        const { result } = renderHookWithPreferDark(themeEnum.light);
        expect(result.current.appTheme).toEqual(themeEnum.light);
      });
    });
  });

  describe('WHEN set a new theme value', () => {
    it('THEN it should return undefined', () => {
      const { result } = renderHookWithoutPreferScheme(randomTheme());

      let setResult;
      act(() => {
        setResult = executeIO(result.current.setTheme(randomTheme()));
      });

      expect(setResult).toBeUndefined();
    });
    it('THEN the theme value should equal to the new value', () => {
      const { result } = renderHookWithoutPreferScheme(randomTheme());
      const newTheme = randomTheme();

      act(() => executeIO(result.current.setTheme(newTheme)));

      expect(result.current.appTheme).toEqual(newTheme);
    });
  });

  describe('WHEN remove the theme', () => {
    it('THEN it should return undefined', () => {
      const { result } = renderHookWithoutPreferScheme(randomTheme());

      let removeResult;
      act(() => {
        removeResult = executeIO(result.current.removeTheme);
      });

      expect(removeResult).toBeUndefined();
    });
    it('THEN the theme value should depend on preferred scheme', () => {
      const { result } = renderHookWithoutPreferScheme(randomTheme());

      act(() => executeIO(result.current.removeTheme));

      expect(result.current.appTheme).toEqual(themeEnum.light);
    });
  });
});
