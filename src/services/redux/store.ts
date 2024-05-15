
import { combineReducers, configureStore, ThunkAction, Action, createListenerMiddleware } from "@reduxjs/toolkit"
import type { PreloadedState } from '@reduxjs/toolkit'

import peopleReducer     from './peopleSlice'
import viewStateReducer, { VIEW_STATE_SELECTED_PERSON_ID_URL_PARAM, setSelectedPersonId } from './viewStateSlice'

// Create the middleware instance to listen for changes to the store
const listenerMiddleware = createListenerMiddleware();

// Define specific listener entries for the actions we are monitoring.
listenerMiddleware.startListening(
  // For the viewState slice, monitor for the setSelectedPersonId() action
  {
    actionCreator: setSelectedPersonId,
    effect: async (action) => {
      // Update 'personid' URL parameter to persist this value.
      // This will replace the current entry in the browser's history, without reloading.
      window.history.replaceState(
        {},
        '',
        window.location.pathname + replaceQueryParam(VIEW_STATE_SELECTED_PERSON_ID_URL_PARAM, action.payload, window.location.search)
      );     
    }
  }
);

// First create a separate root reducer that the RootState type can be extracted from it
export const rootReducer = combineReducers({
  people:    peopleReducer,
  viewState: viewStateReducer
});

// Provide a function to create the Redux store. Will be used below
// and by test cases which need to set up their mock stores.
export const setupStore = (
  preloadedState?: PreloadedState<RootState>,
  addListenerMiddleware?: boolean
) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,    
    // For our primary (not mock) store, add our listener middleware.
    // NOTE: Since this can receive actions with functions inside,
    // it should go before the serializability check middleware
    middleware: addListenerMiddleware ?
                  (getDefaultMiddleware) =>
                    getDefaultMiddleware().prepend(listenerMiddleware.middleware) :
                  undefined
  });
};

// Create our primary store, indicating that we do want to add our listener middleware
const initialState = {};
export const store = setupStore(initialState, true);

export type RootState = ReturnType<typeof rootReducer>

export type AppStore = ReturnType<typeof setupStore>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>

// Open source function to update a URL parameter string with a specific key/value pair
const replaceQueryParam = (param: string, newval: string, search: string) => {
  // Strip out the old value
  const regex = new RegExp("([?;&])" + param + "[^&;]*[;&]?");
  const query = search.replace(regex, "$1").replace(/&$/, '');
  // Append the new key/value pair
  return ((query.length > 2) ? query + "&" : "?") +
         (newval ? (param + "=" + newval) : '');
};
