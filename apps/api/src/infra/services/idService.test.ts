import { idService } from './idService.js';

describe('Generate symbol ID', () => {
  it('WHEN generate symbol ID THEN it should return a string with more than zero length', () => {
    const id = idService.generateSymbolId();

    expect(id).toBeString();
    expect(id.length).toBeGreaterThan(0);
  });
});
