
import { ResponseCodes } from 'http-constants-ts';
import { afterAll, afterEach, beforeAll, describe, test, expect } from 'vitest'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { WIKIMEDIA_FEED_URL, WIKIMEDIA_FEED_URL_PATH, WIKIMEDIA_TIMEOUT_MS, getPeople } from './WikimediaService';

// Add our default request handler mocks
export const restHandlers = [
  // Add a request handler for this Wikimedia API call's successful case.
  // Others will be added below, each overriding this for a specific negative case.
  rest.get(
    `${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`,
    // Note: renamed 'req' parameter to '_req' so that Typescript will not complain about it.
    (_req, res, ctx) => {
      return res(
        ctx.status(ResponseCodes.OK),
        ctx.json(
          // Return a WikimediaOnThisDayResponse
          {
            births: [
              {
                text: "Frankie Jonas, American actor, singer, and songwriter",
                year: 2000,
                pages: [
                  // Wikimedia's API schema does not explain this, but apparently
                  // they return an array of pages, typically one for the person
                  // and one for the date, with the only difference being the date
                  // page's description === 'Day of the year'. Cannot assume
                  // that the person page will be listed first, so let's list it second
                  // to verify that it will be correctly ignored.
                  { type: 'standard',
                    titles: { normalized: "January 1" },
                    description: "Day of the year"
                  },
                  { pageid: 4077,
                    type: 'standard',
                    titles: { normalized: "Frankie Jonas" },
                    description: "American singer, actor, member of the Jonas Family (born 2000)"
                  }
                ]
              } 
            ]
          }
        )
      )
    }
  )
];

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close())

describe(`WikimediaService.getPeople() tests`, async () => {
  // Simulate successful API call case (see default request handler mock, above)
  test(`Successful case`, async () => {
    const resp = await getPeople({ month: '01', day: '01' });
    expect(resp.length).toBe(1);
    expect(resp[0].year).toBe(2000);
    expect(resp[0].fullName).toBe("Frankie Jonas");
    expect(resp[0].description).toBe("American singer, actor, member of the Jonas Family (born 2000)");
  });

  // Simulate network error during API call, or API call has incorrect URL
  test(`Network error case`, async () => {
    server.use(
      rest.get(
        `${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`,
        // Note: renamed 'req' parameter to '_req' so that Typescript will not complain about it.
        (_req, res) => {
          // Simulate a network error
          // Note: special case is needed in the axios.get() try/catch block to detect this simulated network error,
          // see test for !err.response.
          return res.networkError('Failed to connect');
        }
      )
    );
    await expect(getPeople({ month: '01', day: '01' })).rejects.toThrowError(/request failed due to network error/);
  });

  // Simulate server response to API call with incorrect path or invalid month/day parameters
  test(`Incorrect path`, async () => {
    // Still the same URL pattern but we return a 400 as the server would, per their API docs.
    server.use(
      rest.get(`${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`, (_req, res, ctx) => res(ctx.status(ResponseCodes.BAD_REQUEST)))
    );
    await expect(getPeople({ month: '01', day: '01' })).rejects.toThrowError(/Invalid parameter/);
  });

  // Simulate server response to API call with invalid language parameter
  test(`Incorrect language parameter`, async () => {
    // Still the same URL pattern but we return a 501 as the server would, per their API docs.
    server.use(
      rest.get(`${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`, (_req, res, ctx) => res(ctx.status(501)))
    );
    await expect(getPeople({ month: '01', day: '01' })).rejects.toThrowError(/Unsupported language/);   
  });

  // Simulate server response with invalid data: missing 'births' property
  test(`Response data missing 'births' property`, async () => {
    server.use(
      rest.get(`${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`, (_req, res, ctx) =>
        res(ctx.status(ResponseCodes.OK), ctx.json({ nothing_here: true }))
      )
    );
    await expect(getPeople({ month: '01', day: '01' })).rejects.toThrowError(/API failed to return People data/);
  });

  // Simulate server response with no births -- note that Wikimedia returns a 404 in this case,
  // and getPeople() handles that be returning { persons: [] }.
  test(`Response indicates no births for the specified date`, async () => {
    server.use(
      rest.get(`${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`, (_req, res, ctx) =>
        res(ctx.status(ResponseCodes.NOT_FOUND))
      )
    );
    const resp = await getPeople({ month: '01', day: '01' });
    expect(resp.length).toBe(0);
  });

  // Simulate server response with incorrectly formatted birth data
  // Note: could add more like this -- missing each specific property in this structure.
  test(`Response contains incorrectly formatted person data`, async () => {
    server.use(
      rest.get(`${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`, (_req, res, ctx) =>
        res(
          ctx.status(ResponseCodes.OK),
          // Just one person, and is missing 'pages' property
          ctx.json({ births: [{ text: "Frankie Jonas, ...", year: 2000 }] })
        )
      )
    );
    const resp = await getPeople({ month: '01', day: '01' });
    expect(resp.length).toBe(0);
  });

  // Skipping this test as it requires an actual delay
  if (false!) {
    // Simulate a timeout during API call
    test(
      `Timeout case`,
      async () => {
        server.use(
          rest.get(`${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/:month/:day`, (_req, res, ctx) => {
            // Simulate a Timeout
            return res(ctx.delay(WIKIMEDIA_TIMEOUT_MS + 1000));
          })
        );

        // In normal usage 'request failed due to timeout' is thrown but
        // with this test case axios treats the response as completed with no data.
        await expect(getPeople({ month: '01', day: '01' })).rejects.toThrowError(/request failed due to timeout/);
      },
      // Override the default long-running test timeout (5000ms): WIKIMEDIA_TIMEOUT_MS might be 5000ms or longer.
      { timeout: 10000 }
    );
  }
});
