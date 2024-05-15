
// Data fetching service for calls to Wikimedia

import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { ResponseCodes } from 'http-constants-ts';

//-----------------------------------------------------------------------------
// Services
import type { WikimediaOnThisDayResponse } from '../models/Wikimedia';
import type { Person } from '../models/Person';

//-----------------------------------------------------------------------------
// Base URL for Wikimedia API
export const WIKIMEDIA_FEED_URL = `https://api.wikimedia.org`;

// Specific API path (month/date suffix will be added during call to axios.get())
export const WIKIMEDIA_FEED_URL_PATH = `feed/v1/wikipedia/en/onthisday/births`;

// For all Wikimedia APIs, timeout after 8 sec.
// (I've seen occasional delays above 5 sec.)
export const WIKIMEDIA_TIMEOUT_MS = 8000;

const removeAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Work around for this Wikimedia API, which only returns the person's full name
// along with their titles e.g. "(King)" or ", Grand Duke".
// Attempt to ignore titles and extract the last term as the lastName,
// so that our column sort can be based on last names. 
// (Should also strip Roman Numerals, e.g. "Leopold II",
// but should be sufficient for this exercise given this API's limitations.)
const lastNameGuess = (fullName: string) => {
  if (!fullName) return '';

  const s = fullName.replace(/\(.*\)/g, '').replace(/,.*$/, '').trim();
  const lastName = s.split(' ').pop();
  return (lastName && removeAccents(lastName).toLowerCase()) || '';
};

//-----------------------------------------------------------------------------
// Support for calling Wikimedia's "On this day" API
// See: https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day

// Fetch the list of People with birthdays on the specified day, from the Wikimedia API.
export const getPeople = async ({ month, day }: { month: string, day: string }): Promise<Array<Person>> => {  
  let resp: AxiosResponse<WikimediaOnThisDayResponse> | null = null;
  try {
    // Fetch data from API, defaulting to responseType: 'json'.
    // https://stackoverflow.com/questions/66007441/specify-axios-response-data-type
    resp = await axios.get<WikimediaOnThisDayResponse>(
      // url
      // IMPORTANT: must add a unique timestamp to avoid an apparent bug in
      // Wikimedia's API cache. Without this, when running this app on port 5173
      // (i.e. dev) and then within a few minutes running this app on port 8080
      // (i.e. production), that second request **may** come back with a
      // CORS error, incorrectly indicating that the request came from
      // port 5173. This happens even if the 2 apps are run in different
      // browsers.
      `${ WIKIMEDIA_FEED_URL }/${ WIKIMEDIA_FEED_URL_PATH }/${ month }/${ day }?timestamp=${ Date.now() }`,
      // options
      {
        // For this exercise, demonstrate that timeout conditions are properly handled.
        timeout: WIKIMEDIA_TIMEOUT_MS,

        // Wikimedia states that this is required, see: https://meta.wikimedia.org/wiki/User-Agent_policy
        headers: {
          'Api-User-Agent': "BornToday/1.0"
        }
      }
    );

    //

  } catch (err) {
    // NOTE: this may seem excessive for this specific API but is intended
    // as a model to be used when this service supports multiple API calls.
    // In that case, this logic could be moved to an Axios response
    // interceptor (or just a helper function) and thereby shared across the
    // service functions making those API calls.
    if (axios.isAxiosError(err)) {
      // Must check for this before NetworkError
      if (err.code === 'ECONNABORTED') {
        // Timeout: indicate that caller can Retry
        throw new Error('WikimediaService: request failed due to timeout');
      }

      if (err.code === 'ERR_CANCELED') {
        // Caller cancelled the request
        throw new Error('WikimediaService: request cancelled');
      }

      // In order to detect real network errors AND mocked network errors
      // from Mock Service Worker's networkError(), must use this test
      // instead of (err.code === 'ERR_NETWORK'), which only works for real network errors.
      // See https://github.com/axios/axios/issues/383
      // This would also be triggered if we had the wrong URL.
      if (!err.response) {
        // Network error / no connection: indicate that caller can Retry
        throw new Error('WikimediaService: request failed due to network error');
      }

      // For other HTTP ResponseCodes, indicate to caller the type of error.
      if (err.response.status) {
        switch (err.response.status) {
          case ResponseCodes.BAD_REQUEST:
            // API returned status: 400 (Invalid Parameter / incorrect path)
            throw new Error('WikimediaService: Invalid parameter');

          case ResponseCodes.NOT_IMPLEMENTED:
            // API returned status: 501 (Unsupported language)
            throw new Error('WikimediaService: Unsupported language');

          case ResponseCodes.NOT_FOUND:
            // API returned status: 404 (No Data Found)
            // We don't consider this an error, just return an empty array.
            return [];
                
          default:
            // Unexpected HTTP ResponseCode -- indicate that a Retry might clear it.
            throw new Error('WikimediaService: Unexpected HTTP ResponseCode');
        }
      }
    }
    // Unexpected error
    throw new Error('WikimediaService: Unexpected error');
  }

  const respData = resp?.data; // as WikimediaOnThisDayResponse;

  // Make sure the response data was parsed as JSON and has
  // a 'births' property.
  if (respData?.births) {
    // Map the 'births' array elements into our Array<Person>
    const people = respData.births.map((item) => {
      // Wikimedia's API schema does not explain this, but apparently
      // they return an array of pages, typically one for the person
      // and one for the date, with the only difference being the date
      // page's description === 'Day of the year'. Cannot assume
      // that the person page will be listed first, so must scan for it.
      const page =
        item?.pages?.find((itemPage) => ((itemPage?.type === 'standard') && (itemPage?.description !== 'Day of the year')));

      return (page && page.pageid) ?
        {
          // Transform Wikimedia's 'pageid' into our 'id'. This will
          // be used to uniquely identify each Person in our UX
          // and when persisting selectedPersonId.
          id: `pageid-${ page.pageid }`,

          year: item.year,

          // Note: we are avoiding their deprecated fields,
          // see: https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day#Response_schema
          fullName:    page.titles?.normalized, // e.g. "Frankie Jonas"
        
          description: page.description,
          thumbnail:   page.thumbnail,
          image:       page.originalimage,

          // Derived fields, to improve filter/sort performance in <PeopleListView>
          fullNameLowercase:      (page.titles?.normalized && removeAccents(page.titles.normalized).toLowerCase()) || '',
          lastNameGuessLowercase: lastNameGuess(page.titles?.normalized),
          descriptionLowercase:   (page.description && removeAccents(page.description).toLowerCase()) || ''
        } as Person :

        // API returned an item which is missing key details, skip it.
        null;
    })
    // Filter out null elements (skipped items)
    .filter((person: Person | null) => (person !== null)) as Array<Person>;
    return people;
  }

  // Response does not contain 'births', assume this is a temporary API issue and indicate a Retry might help.
  throw new Error('WikimediaService: API failed to return People data:');
}
