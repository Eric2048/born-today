
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button'

export interface ErrorDialogProps {
  show:     boolean;
  message:  string;
  onClose?: () => void
}

const ErrorDialog = (props: ErrorDialogProps) => {
  const { show, message, onClose  } = props;

  //----------------------------------------------------------------------------
  // Event Handlers
  //----------------------------------------------------------------------------
  return (
    <Modal
      // Lots of options -- see https://react-bootstrap.github.io/components/modal
      show={ show }
      
      centered
      
      dialogClassName="confirmation-dialog"

      // "Include a backdrop component. Specify 'static' for a backdrop that doesn't trigger an "onHide" when clicked."
      // ISSUE: even with this set to true/false, outside clicks are ignored. Does not invoke onHide().
      backdrop="static"

      // "Close the modal when escape key is pressed" -- but must specify onEscapeKeyDown, see below.
      // When false, dialog will detect ESC key and show the "disallowed" animation.
      keyboard={ true }

      // When keyboard={ true }, this is called when ESC is pressed.
      onEscapeKeyDown={ onClose }
    >
      <Modal.Header>
        <Modal.Title style={{ width: '100%', textAlign: 'center' }}>Error</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        { message }
      </Modal.Body>

      <Modal.Footer >
        <Button variant="secondary" onClick={ onClose }>
          Ok
        </Button>
      </Modal.Footer>
    </Modal>      
  );
}

export default ErrorDialog;
