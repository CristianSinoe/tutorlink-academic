import { useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { AdminPresentationContext } from '../../context/AdminPresentationContext';

export default function Dialog({ title, children, onClose, initialFocusSelector = 'button:not([disabled])', footer, closeLabel = 'Cerrar ventana', showClose = true, wide = false, size, dirty = false, busy = false }) {
  const admin = useContext(AdminPresentationContext);
  const ref = useRef(null); const cancelDiscard = useRef(null); const previousPromptFocus = useRef(null);
  const titleId = useId(); const [discard, setDiscard] = useState(false);
  const callbacks = useRef({ onClose, dirty, busy, discard });
  useEffect(() => { callbacks.current = { onClose, dirty, busy, discard }; });
  const requestClose = useCallback(() => {
    const current = callbacks.current;
    if (current.busy) return;
    if (current.dirty) { previousPromptFocus.current = document.activeElement; setDiscard(true); }
    else current.onClose();
  }, []);
  useEffect(() => { if (discard) cancelDiscard.current?.focus(); }, [discard]);
  const keepEditing = () => { setDiscard(false); previousPromptFocus.current?.focus(); };
  useEffect(() => {
    const previous = document.activeElement; const dialog = ref.current;
    const focusable = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')].filter(element => !element.closest('[hidden]'));
    (dialog.querySelector(initialFocusSelector) || dialog).focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        if (callbacks.current.discard) { setDiscard(false); previousPromptFocus.current?.focus(); }
        else requestClose();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable(); const first = elements[0]; const last = elements.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const backgrounds = [...document.querySelectorAll('[data-context-background]')].filter(element => !element.contains(dialog));
    const inertStates = backgrounds.map(element => element.hasAttribute('inert'));
    backgrounds.forEach(element => element.setAttribute('inert', ''));
    const previousOverflow = document.body.style.overflow;
    if (admin) document.body.style.overflow = 'hidden';
    dialog.addEventListener('keydown', onKeyDown);
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      backgrounds.forEach((element, index) => { if (!inertStates[index]) element.removeAttribute('inert'); });
      if (admin) document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [admin, initialFocusSelector, requestClose]);
  const effectiveSize = size || (wide ? 'management' : 'form');
  return createPortal(<div className={`tl-dialog-backdrop${admin ? ' tl-admin' : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) requestClose(); }}>
    <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy || undefined}
      onClickCapture={event => { if (event.target.closest('[data-dialog-close]')) { event.preventDefault(); event.stopPropagation(); requestClose(); } }}
      className={`tl-dialog${admin ? ` tl-dialog-admin tl-dialog-${effectiveSize}` : wide ? ' tl-dialog-wide' : ''}`}>
      <div className={admin ? 'tl-dialog-header' : 'flex items-start justify-between gap-4'}><h2 id={titleId}>{title}</h2>{showClose && <button type="button" className="tl-icon-button" disabled={busy} aria-label={closeLabel} onClick={requestClose}>×</button>}</div>
      <div className={admin ? 'tl-dialog-body' : 'mt-4'} hidden={discard}>{children}</div>
      {discard && <div className="tl-discard-prompt" role="alert"><p>Hay cambios sin guardar. ¿Quieres descartarlos?</p><div className="flex flex-wrap gap-3"><button ref={cancelDiscard} type="button" className="tl-button-secondary" onClick={keepEditing}>Seguir editando</button><button type="button" className="tl-button-danger" onClick={() => callbacks.current.onClose()}>Descartar cambios</button></div></div>}
      {footer && <div hidden={discard} className={admin ? 'tl-dialog-footer' : 'mt-6 flex flex-wrap justify-end gap-3'}>{footer}</div>}
    </section>
  </div>, document.body);
}
Dialog.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node, onClose: PropTypes.func.isRequired, initialFocusSelector: PropTypes.string, footer: PropTypes.node, closeLabel: PropTypes.string, showClose: PropTypes.bool, wide: PropTypes.bool, size: PropTypes.oneOf(['confirmation', 'form', 'profile', 'management']), dirty: PropTypes.bool, busy: PropTypes.bool };
