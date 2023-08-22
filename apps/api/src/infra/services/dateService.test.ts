import { dateService } from './dateService.js';

describe('Get current date', () => {
  it('WHEN get current date THEN it should return a valid date', () => {
    const date = dateService.getCurrentDate();

    expect(date).toBeValidDate();
  });
});
