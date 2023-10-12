import { dateService } from './service.js';

describe('Get current date', () => {
  it('[WHEN] get current date [THEN] it will return a valid date', () => {
    const date = dateService.getCurrentDate();

    expect(date).toBeValidDate();
  });
});
