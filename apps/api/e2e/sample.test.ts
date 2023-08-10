import { expectHttpStatus } from './commands/expect.js';
import { client } from './commands/http-client.js';

describe('Sample E2E testing', () => {
  it('Call server return HTTP200 with Hello', async () => {
    const resp = await client.get('/v1/');

    expectHttpStatus(resp, 200);
    expect(resp).toHaveProperty('data', 'Hello');
  });
});
