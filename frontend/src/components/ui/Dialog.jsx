import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

export default function Dialog({ title, children, onClose, initialFocusSelector = 'button:not([disabled])', footer, closeLabel = 'Cerrar ventana', showClose = true, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const focusable = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
    dialog.querySelector(initialFocusSelector)?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const elements = focusable(); const first = elements[0]; const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    const backgrounds = [...document.querySelectorAll('[data-context-background]')].filter(element => !element.contains(dialog));
    backgrounds.forEach(element => element.setAttribute('inert', ''));
    dialog.addEventListener('keydown', onKeyDown);
    return () => { dialog.removeEventListener('keydown', onKeyDown); backgrounds.forEach(element => element.removeAttribute('inert')); previous?.focus(); };
  }, [initialFocusSelector, onClose]);
  return createPortal(<div className="tl-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`tl-dialog${wide ? ' tl-dialog-wide' : ''}`}>
      <div className="flex items-start justify-between gap-4"><h2 id={titleId}>{title}</h2>{showClose && <button type="button" className="tl-icon-button" aria-label={closeLabel} onClick={onClose}>×</button>}</div>
      <div className="mt-4">{children}</div>{footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
    </section>
  </div>, document.body);
}

Dialog.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node, onClose: PropTypes.func.isRequired, initialFocusSelector: PropTypes.string, footer: PropTypes.node, closeLabel: PropTypes.string, showClose: PropTypes.bool, wide: PropTypes.bool };
