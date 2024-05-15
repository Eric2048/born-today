# Overview
React-based app which lists the notable individuals born today, from the wikimedia API. Uses Vite, Typescript, and Redux

## Build Instructions
```sh
npm install
```

### dev build:
```sh
npm run dev
```
Then open http://localhost:5173

### To run tests:
```sh
npm run test
```

### production build:
```sh
npm run build
cd dist
python3 -m http.server 8080
```
Then open http://localhost:8080

## Core Requirements (for the interview)
These are required for the interview:
- An initial page with a "Show People Born Today" button.
- When clicked, a second page appears, listing all of the individuals returned from the Wikimedia API, having today as their birthdate.
- Show basic info for each individual, including their image (if provided by the API)
- UX must show data loading status and error state

## Added Requirements
I've added these features:
- Responsive layout
    - App content is limited to width of 1268px.
    - Below that width, the image size is reduced.
    - Below 1200px, the table cells show their contents in two lines to conserve width, image keeps shrinking.
    - At 900px, the table is stacked above the thumbnail image.
    - Min width is 376px (iPhone SE in portrait mode)
- Preserving the application state (the selected Person)
    - The selected Person's id is saved as a URL parameter.
    - When the App loads, if that parameter is present then the People list is immediately fetched and displayed, highlighting that person (scrolling if necessary).
    - If that parameter is illegal, for example a selection from the previous day, it is ignored.
    - **To reset to no saved selection**, open the app without this parameter (i.e. in dev, use: http://localhost:5173)
- Providing Sort and Filter support for the People list, including:
    - Best efforts to extract the person's last name from the 'full name & title' string provided by the API.
    - Treating accented chars as their base char equivalent.

## Non-Requirements
These aspects were ***not implemented***, to limit scope.
- Supporting legacy / obscure browsers such as IE and Opera Mini
    - The App supports Vite's browser list: https://vitejs.dev/config/build-options.html#build-target
- Providing I18N support
    - All App UX text and displayed Wikipedia results will be in US English.
- Formatting the displayed "Today's Date" based on the current locale
- Setting up a cloud hosting environment (AWS etc) to serve this web app

## Testing Coverage
Partial test coverage is provided in each testing area, per the requirements.
- Unit tests for this app's fetchBirths() service, using Mock Service Worker -- WikimediaService.test.ts (deep coverage here to verify handling of potential error conditions, including network errors, and timeouts.)
- Unit tests for the Redux 'viewState' slice (tests reducers in isolation and actions & reducers working together in a mock store) -- viewStateSlice.test.ts
- Component test for the App / PeopleList components (including rendering in jsdom, Mock Service Worker, mock Redux store, and simulated events) -- App.test.tsx
- The app's getPeople() (in WikimediaService.ts) function has extensive unit test cases to verify its handling of the potential error conditions, including network errors, and timeouts.

Future improvements could include:
- Extending react-testing-library with @testing-library/user-event to improve the fidelity of the simulated browser events.
- Using Cypress for end-to-end in-browser testing to drive and verify complex user interaction test cases.

## Key Design Decisions
- Frameworks, Libraries, and Tools
    - Vite (note: using vite with Babel instead of the Rust compiler/bundler, to avoid any potential env-specific issues which could occur when sharing this project to reviewers)
    - Typescript, React, Redux, Redux Toolkit
    - Sass, Bootstrap, react-bootstrap
    - Vitest, React Testing Library, Mock Service Worker
    - axios, @inovua/reactdatagrid-community
- Modularity
    - Defined separate modules for components, dialogs, and services
    - The app's 'WikimediaService' handles all aspect of the Wikimedia API call and interpretation of the potential error cases, decoupling the App's UX components from these details.
- Performance
    - This specific Wikimedia API does not support paginated queries, so the app receives all People with births on the current day. This appears to be between 200-300 per day, which does not present any data-fetch or rendering performance issue. The open-source ReactDataGrid component is run in 'local' mode using this data. (That component's Local pagination feature could be enabled with a one-line change.)
- Robustness
    - Note that I had to add a unique timestamp in each request sent to the Wikimedia API, to avoid an apparent bug in Wikimedia's API cache. Without this, when running this app on port 5173 (i.e. dev) and then within a few minutes running this app on port 8080 (i.e. production), that second request **may** come back with a CORS error, incorrectly indicating that the request from 8080 came from port 5173. This happens even if the 2 apps are run in different browsers. Adding this timestamp prevents that cache from caching the API responses.
