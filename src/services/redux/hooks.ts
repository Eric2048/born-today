
// Using react-redux, create typed hooks for our React components
// This is not part of the vite react-ts template but is important for Typescript.
// See: https://redux.js.org/usage/writing-tests#integration-testing-connected-components-and-redux-logic
// also shown in: https://redux-toolkit.js.org/api/createAsyncThunk#canceling-while-running

import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"

// Services
import type { RootState, AppDispatch } from "./store"

// Use this instead of appDispatch().
// It returns AppDispatch (which is typeof store.dispatch) instead of Dispatch<AnyAction>.
// export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Use this instead of useSelector(), so can for example do this without having
// to specify RootState as the type for 'state':
//   useAppSelector((state) => state.foo);
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
