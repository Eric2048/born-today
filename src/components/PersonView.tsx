
import Card from 'react-bootstrap/Col';
import CardBody from 'react-bootstrap/CardBody';
import CardTitle from 'react-bootstrap/CardTitle';
import CardText from 'react-bootstrap/CardText';
import Image from 'react-bootstrap/Image';

// Services
import { useAppSelector } from '../services/redux/hooks';
import { selectSelectedPersonId } from '../services/redux/viewStateSlice'
import { selectPersonById }       from '../services/redux/peopleSlice'

const PersonView = () => {
  // Get the current selectedPersonId from Redux (any changes will force this component to re-render)
  const selectedPersonId = useAppSelector(selectSelectedPersonId);

  // Get that selected person from Redux people list.
  const person = useAppSelector((state) => selectPersonById(state, selectedPersonId));

  return person && (
    <Card className="mb-5 p-3 bg-body rounded shadow person-view">
      {/* ^^^ shadow: https://getbootstrap.com/docs/5.0/utilities/shadows/ */}
      {/*     bg-body: background color */}

      { person?.thumbnail?.source ? (
          <>
            {/* fluid: scale image based on parent container */}
            <Image fluid src={ person.thumbnail.source } alt="Person image" className="rounded shadow person-view-image" />
          </>
        ) : (
          <>
            {/* Placeholder when there is no image */}
            <div className='person-view-noimage' />
          </>
        )
      }

      <CardBody>
        {/* text-break: prevent non-breaking strings from forcing component's width */}
        <CardTitle className='text-center text-break'>
          <span className="fw-bold">{ person?.fullName }</span>
          {/* Append their birth year if it's not in the description */}
          { person && (!person?.description || (person?.description.indexOf(person.year.toString()) === -1)) && <span className="fst-italic card-title-year">&nbsp;({ person.year })</span> }
        </CardTitle>

        <CardText className="text-center text-break fst-italic">{ person?.description }</CardText>
      </CardBody>
    </Card>
  );
};

export default PersonView;
