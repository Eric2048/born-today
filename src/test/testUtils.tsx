
// Utility function to create a mock store and a <Provider> to provide it,
// from https://redux.js.org/usage/writing-tests#setting-up-a-reusable-test-render-function

import React, { PropsWithChildren } from 'react'

// import { configureStore } from '@reduxjs/toolkit'
import type { PreloadedState } from '@reduxjs/toolkit'

import { Provider } from 'react-redux'

import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'

import type { AppStore, RootState } from '../services/redux/store'
import { setupStore } from '../services/redux/store'

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: AppStore
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},

    // Automatically create a store instance if no store was passed in
    store = setupStore(preloadedState),

    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<object /* {} */>): JSX.Element {
    return <Provider store={store}>{children}</Provider>
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
