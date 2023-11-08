import { AxiosResponse } from 'axios';

export const expectHttpStatus = (resp: AxiosResponse<unknown, unknown>, status: number) => {
  return expect(
    resp,
    `Got status ${resp.status} with response body ${JSON.stringify(resp.data)} instead`,
  ).toHaveProperty('status', status);
};
