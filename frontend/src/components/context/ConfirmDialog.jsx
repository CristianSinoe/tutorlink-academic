import PropTypes from 'prop-types';
import Dialog from '../ui/Dialog';

export default function ConfirmDialog({ title, children, onConfirm, onCancel }) {
  return <Dialog title={title} onClose={onCancel} showClose={false} initialFocusSelector=".tl-button-secondary" footer={<>
        <button className="tl-button-secondary" type="button" onClick={onCancel}>Cancelar</button>
        <button className="tl-button-primary" type="button" onClick={onConfirm}>Continuar</button>
      </>}>
      <div className="my-4">{children}</div>
    </Dialog>;
}
ConfirmDialog.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node, onConfirm: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired };
