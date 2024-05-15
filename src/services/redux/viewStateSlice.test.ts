
// Unit Tests for the 'viewState' slice

import { describe, test, expect } from 'vitest'

// Services
import { setupStore } from './store'
import viewStateReducer, { setSelectedPersonId, SELECTED_PERSON_ID_NONE } from './viewStateSlice'

// Unit Tests for reducers
describe(`viewStateSlice reducers`, () => {
  test(`setSelectedPersonId(v)`, () => {
    const previousState = {
      selectedPersonId: SELECTED_PERSON_ID_NONE
    };
    const state = viewStateReducer(previousState, setSelectedPersonId('pageid-9254077'));
    expect(state).toEqual({ selectedPersonId: 'pageid-9254077' });
  });
});

// NOTE: not providing Unit Tests for the actions in isolation,
// based on this: https://redux.js.org/usage/writing-tests#action-creators--thunks
// However the following tests will verify the actions and their reducers working together.

// Unit Tests for actions and their reducers working inside a mock store
describe(`viewStateSlice action & reducer tests`, () => {
  // Set up a mock store
  const preloadedState = {};
  const store = setupStore(preloadedState);

  // Verify initial state
  test(`Verify initial viewState in mock store`, () => {
    const state = store.getState();
    expect(state).toHaveProperty('viewState');
    expect(state.viewState).toEqual({ selectedPersonId: '' });
  });

  // Test this slice's actions/reducers
  test(`action: setSelectedPersonId(v)`, () => {
    store.dispatch(setSelectedPersonId('pageid-9254077'));
    const state = store.getState();
    expect(state).toHaveProperty('viewState');
    expect(state.viewState).toEqual({ selectedPersonId: 'pageid-9254077' });
  });

  test(`action: setSelectedPersonId('')`, () => {
    store.dispatch(setSelectedPersonId(SELECTED_PERSON_ID_NONE));
    const state = store.getState();
    expect(state).toHaveProperty('viewState');
    expect(state.viewState).toEqual({ selectedPersonId: SELECTED_PERSON_ID_NONE });
  });
});
