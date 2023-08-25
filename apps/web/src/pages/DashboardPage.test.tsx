import { generateMock } from '@anatine/zod-mock';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { API_ENDPOINTS } from '#features/portfolios/repositories/portfolioRepository.constant';
import { BASE_URL } from '#infra/httpClient.constant';
import { renderWithContexts } from '#test-utils/render';

import DashboardPage from './DashboardPage';

const { url, responseSchema } = API_ENDPOINTS.GET_PORTFOLIOS;
const server = setupServer();
const serverUrl = `${BASE_URL}${url}`;

function renderDashboardPage() {
  return renderWithContexts(<DashboardPage />, ['Infra', 'ServerState', 'Routes']);
}
function getSnipper() {
  return screen.getByRole('progressbar');
}
function findCreatePortfolioMsg() {
  return screen.findByText(/you do not have a portfolio. please create one to continue./i);
}
function findCreatePortfolioButton() {
  return screen.findByRole('button', { name: /open create portfolio form/i });
}
function findPageHeading() {
  return screen.findByRole('heading', { name: /dashboard/i });
}
function findRetryMsg() {
  return screen.findByText(/failed to fetch data from server. please try again./i);
}
function findRetryButton() {
  return screen.findByRole('button', { name: /retry fetching data/i });
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('WHEN portfolios is loading', () => {
  it('THEN it should display snipper', () => {
    server.use(
      rest.get(serverUrl, (_, res, ctx) => res.once(ctx.status(200), ctx.json(generateMock(responseSchema)))),
    );

    renderDashboardPage();

    expect(getSnipper()).toBeVisible();
  });
});

describe('WHEN no portfolio is returned', () => {
  it('THEN it should display message and create new portfolio button', async () => {
    server.use(rest.get(serverUrl, (_, res, ctx) => res.once(ctx.status(200), ctx.json([]))));

    renderDashboardPage();

    await expect(findCreatePortfolioMsg()).resolves.toBeVisible();
    await expect(findCreatePortfolioButton()).resolves.toBeVisible();
  });
});

describe('WHEN some portfolios is returned', () => {
  it('THEN it should display dashboard content', async () => {
    server.use(
      rest.get(serverUrl, (_, res, ctx) => res.once(ctx.status(200), ctx.json(generateMock(responseSchema)))),
    );

    renderDashboardPage();

    await expect(findPageHeading()).resolves.toBeVisible();
  });
});

describe('WHEN cannot fetch data from server until max attempts', () => {
  it('THEN it should display message and retry button', async () => {
    server.use(rest.get(serverUrl, (_, res, ctx) => res(ctx.status(400))));

    renderDashboardPage();

    await expect(findRetryMsg()).resolves.toBeVisible();
    await expect(findRetryButton()).resolves.toBeVisible();
  });
});

describe('WHEN user click on the retry fetching button', () => {
  it('THEN it should start fetching data from server again', async () => {
    let serverCount = 0;
    server.use(
      rest.get(serverUrl, (_, res, ctx) => {
        serverCount += 1;
        return res(ctx.status(400));
      }),
    );

    renderDashboardPage();

    const retryButton = await findRetryButton();
    expect(serverCount).toBe(3);

    const user = userEvent.setup();
    await user.click(retryButton);
    await findRetryButton();
    expect(serverCount).toBe(6);
  });
});
