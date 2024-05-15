
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

// Components
import PeopleListView from './PeopleListView';
import PersonView     from './PersonView';

function PeopleView() {
  return (
    <Container fluid className="people-view">
      {/* ^^^ fluid adds width: 100% */}

      <Row className="people-view-row">
        {/* On mobile (narrow widths), CSS will stack these two columns. On desktop, they are shown side-by-side. */}
        <Col className="mb-2 people-view-left">
          <PeopleListView />
        </Col>

        <Col className="people-view-right">
          <PersonView />
        </Col>
      </Row>
    </Container>
  )
}

export default PeopleView
