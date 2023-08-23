import { generateMock } from '@anatine/zod-mock';
import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { BASE_URL } from '#infra/httpClient.constant';
import { renderWithContexts } from '#test-utils/render';

import { API_ENDPOINTS } from '../repositories/portfolioRepository.constant';
import CreatePortfolioForm from './CreatePortfolioForm';

const { url, responseSchema } = API_ENDPOINTS.CREATE_PORTFOLIO;
const server = setupServer();
const serverUrl = `${BASE_URL}${url}`;

function renderCreatePortfolioForm() {
  return renderWithContexts(<CreatePortfolioForm />, ['Infra', 'ServerState']);
}
async function fillAndSubmitForm(takerFee: number, makerFee: number) {
  const initialCapital = faker.number.float({ min: 0, max: 1000, precision: 0.00000001 });
  const user = userEvent.setup();
  await user.type(getTextField(/initial capital/i), `{selectall}${initialCapital}`);
  await user.type(getTextField(/taker trading fee/i), `{selectall}${takerFee}`);
  await user.type(getTextField(/maker trading fee/i), `{selectall}${makerFee}`);
  await user.click(getSubmitButton());
}
function getTextField(name: RegExp) {
  return screen.getByRole('textbox', { name });
}
function getSubmitButton() {
  return screen.getByRole('button', { name: /create portfolio/i });
}
function findSuccessfulMsg() {
  return screen.findByText(/your portfolio has been successfully created./i);
}
function findErrorMsg() {
  return screen.findByText(/something went wrong/i);
}
function mockResponse() {
  return generateMock(responseSchema);
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('WHEN creating portfolio is sucessful', () => {
  it('THEN it should display successful message', async () => {
    const response = mockResponse();
    server.use(rest.post(serverUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(response))));

    renderCreatePortfolioForm();
    await fillAndSubmitForm(response.takerFee, response.makerFee);

    await expect(findSuccessfulMsg()).resolves.toBeVisible();
  });
});

describe('WHEN creating portfolio fails', () => {
  it('THEN it should display error message', async () => {
    server.use(rest.post(serverUrl, (_, res, ctx) => res(ctx.status(500))));

    renderCreatePortfolioForm();
    const { takerFee, makerFee } = mockResponse();
    await fillAndSubmitForm(takerFee, makerFee);

    await expect(findErrorMsg()).resolves.toBeVisible();
  });
});
