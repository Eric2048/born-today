
import { useEffect } from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'

// Services
import { useAppSelector, useAppDispatch }                               from './services/redux/hooks'
import { VIEW_STATE_SELECTED_PERSON_ID_URL_PARAM, setSelectedPersonId } from './services/redux/viewStateSlice'
import { PeopleStatus, fetchPeople, resetState, selectPeopleStatus }    from './services/redux/peopleSlice'

// Components
import PeopleView  from './components/PeopleView'
import ErrorDialog from './modals/ErrorDialog'

// CSS
import './App.scss'

function App() {
  const dispatch = useAppDispatch();

  // Get the loading/error status of our 'people' slice. Will force this component to re-render on change.
  const peopleStatus = useAppSelector(selectPeopleStatus);

  // When first mounted, see if we have a 'personid' URL parameter.
  // Note: the alternate approach would be to have store.ts detect this
  // URL param and include it in the initialState for the Redux store.
  // But then this useEffect() would need to depend on useAppSelector(selectSelectedPersonId)
  // which would cause this component to constantly re-render as selections
  // are made within <PeopleListView>.
  useEffect(() => {
    // Already loading?
    if (peopleStatus === PeopleStatus.Idle) {
      // No. Do we have this URL parameter?
      const urlSearchParams = window && (new URLSearchParams(window.location.search));
      const selectedPersonId = urlSearchParams?.get(VIEW_STATE_SELECTED_PERSON_ID_URL_PARAM) || '';
      if (selectedPersonId) {
        // Yes: save this to our Redux store 'viewState'.
        // If this personId is invalid (e.g. is from yesterday) then <PeopleListView> will ignore it.
        dispatch(setSelectedPersonId(selectedPersonId));

        // And fetch people list from the Wikipedia API.
        // Get today's date in this browser's time zone (code from Wikipedia sample).
        // No need to use 'date-fns' as we are not parsing or manipulating Dates.
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        // Get information about this day in history from English Wikipedia
        dispatch(fetchPeople({ month, day }));
      }
    }
  }, [ dispatch, peopleStatus ])

  //----------------------------------------------------------------------------
  // Event Handlers
  const onShowPeopleList = () => {
    // Get today's date in this browser's time zone (code from Wikipedia sample).
    // No need to use 'date-fns' as we are not parsing or manipulating Dates.
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // Get information about this day in history from English Wikipedia
    dispatch(fetchPeople({ month, day }));
  };

  // Passed to <ErrorDialog>, which will call this when the users clicks Ok to close the dialog.
  const onClose = () => {
    // Reset the state of our People slice in the Redux store, so the user can try again.
    dispatch(resetState());
  };

  return (
    <>
      <Container fluid className="vh-100 d-flex flex-column bg-light bg-gradient app-container">
        {/* ^^^ fluid: will fill available width */}
        {/*     vh-100: expand to full height */}
        {/*     d-flex: 'display: flex' to allow 'flex-grow: 1' on 2nd <Row> */}
        {/* See: https://getbootstrap.com/docs/5.0/utilities/flex */}

        <Row className="app-row-top">
          {/* Show today's month/day (in the current time zone) */}
          <Col><h1 className="app-title">People Born Today: { new Date().toLocaleDateString('en-us', { month: 'long', day: 'numeric' }) }</h1></Col>
        </Row>

        {/* flex-grow-1: expand row to remaining vertical height */}
        <Row className="flex-grow-1 app-row-bottom">
          <Col className="app-row-bottom-col">
            { (peopleStatus === PeopleStatus.Idle) && (
                <Button
                  variant="primary"
                  onClick={ onShowPeopleList }
                >
                  Show People Born Today
                </Button>
              )
            }

            { (peopleStatus === PeopleStatus.Loading) && <div>Loading...</div> }

            { (peopleStatus === PeopleStatus.Succeeded) && <PeopleView />}
          </Col>
        </Row>
      </Container>

      {/* Note: passing show into this component, instead of conditionally displaying it based on show,
          so that it can run through its opening/closing animation sequence. */}
      <ErrorDialog show={ peopleStatus === PeopleStatus.Failed } message={ 'Error loading data from Wikimedia' } onClose={ onClose }/>
    </>
  )
}

export default App
