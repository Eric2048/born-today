
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'

// Constants & Types
export const SELECTED_PERSON_ID_NONE = '';
export const VIEW_STATE_SELECTED_PERSON_ID_URL_PARAM = 'personid';

const viewStateSlice = createSlice({
  name: 'viewState',
  
  initialState: {
    selectedPersonId: SELECTED_PERSON_ID_NONE // Default to ''
  },

  reducers: {
    setSelectedPersonId: (state, action: PayloadAction<string>) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.selectedPersonId = action.payload
    }
  }
})

// Export our reducers
export const { setSelectedPersonId } = viewStateSlice.actions;

export default viewStateSlice.reducer;

// https://redux.js.org/usage/deriving-data-selectors#passing-input-parameters

// Provide a memoized selector to extract this property.
export const selectSelectedPersonId = createSelector(
  [ 
    // Input selector: this selector is only re-defined if this result changes
    (state) => state.viewState,
  ],
  // Output selector: takes the result from above and transforms it to the property we are seeking.
  (viewState) => viewState.selectedPersonId
);
