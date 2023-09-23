import { randomString } from '#test-utils/faker/string.js';

import { isValidTimezoneString } from './string.js';

describe('Validate Timezone string', () => {
  it('[WHEN] the input is a valid timezone string [THEN] it will return true', () => {
    expect(isValidTimezoneString(Intl.DateTimeFormat().resolvedOptions().timeZone)).toBeTrue();
  });
  it('[WHEN] the input is an invalid timezone string [THEN] it will return false', () => {
    expect(isValidTimezoneString(randomString())).toBeFalse();
  });
});
