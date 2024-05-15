/**
 * @vitest-environment jsdom
 */

// ^^^ The above comment is important, configuring vitest to use jsdom for these tests.
// See:
//   https://testing-library.com/docs/dom-testing-library/setup/#using-without-jest
//   https://vitest.dev/config/#environment
//   https://dev.to/mbarzeev/from-jest-to-vitest-migration-and-benchmark-23pl

// This is a Component Tests for the App component, including:
//   - Rendering the <App> component (into jsdom)
//   - Triggering its "Load Data" button
//   - Providing a mock server response using Mock Service Worker
//   - Providing a mock Redux store
//   - Verifying that the <App> component renders the <PeopleListView> component
//     which renders the correct user data from the mock server response.

import { ResponseCodes } from 'http-constants-ts';
import { afterAll, afterEach, beforeAll, describe, test, expect } from 'vitest'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { fireEvent, screen } from '@testing-library/react'

// Get our custom rendering function
import { renderWithProviders } from './test/testUtils'

// Services
import { WIKIMEDIA_FEED_URL, WIKIMEDIA_FEED_URL_PATH } from './services/WikimediaService';

// Components
import App from './App'

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
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

describe(`App component tests`, async () => {
  test('Renders, detects user click, fetchs data, renders data', async () => {
    renderWithProviders(<App />);

    // Verify initial rendering: page title and not yet loading.
    expect(screen.getByText(/People Born Today:/i)).toBeInTheDocument();
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();

    // Click the "Load data" button to initiate the data fetch,
    // verify "Loading..." appears.
    fireEvent.click(screen.getByRole('button', { name: /Show People Born Today/i }));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    // Verify that the <PeopleListView> component renders showing the person from the mock data.
    expect(await screen.findByText(/Frankie Jonas/i)).toBeInTheDocument();
  });
});
