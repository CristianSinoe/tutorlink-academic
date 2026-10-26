import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Button from './Button';
import ActionIcon from './ActionIcon';

export default function IconButton({ icon, label, description, variant = 'secondary', onClick, onKeyDown, ...props }) {
  const anchor = useRef(null);
  const tooltip = useRef(null);
  const hideTimer = useRef(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const show = () => { clearTimeout(hideTimer.current); setOpen(true); };
  const close = () => { clearTimeout(hideTimer.current); setOpen(false); };
  const hideLater = () => {
    if (anchor.current?.matches(':focus-visible')) return;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!anchor.current?.isConnected || !tooltip.current) return;
      const rect = anchor.current.getBoundingClientRect();
      const box = tooltip.current.getBoundingClientRect();
      setPosition({
        left: Math.max(12, Math.min(rect.left + rect.width / 2 - box.width / 2, window.innerWidth - box.width - 12)),
        top: rect.top > box.height + 12 ? rect.top - box.height - 8 : rect.bottom + 8,
      });
    };
    place();
    const button = anchor.current;
    const dismiss = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    };
    // Run before a containing Dialog's native key handler.
    button.addEventListener('keydown', dismiss);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { button.removeEventListener('keydown', dismiss); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);
  return <>
    <Button {...props} ref={anchor} type="button" variant={variant} iconOnly aria-label={label}
      aria-describedby={open && description ? id : undefined}
      onMouseEnter={show} onMouseLeave={hideLater}
      onFocus={show} onBlur={close}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
        onKeyDown?.(event);
      }}
      onClick={event => { close(); onClick?.(event); }}>
      <ActionIcon name={icon} /><span className="sr-only">{label}</span>
    </Button>
    {open && createPortal(<span id={id} ref={tooltip} role="tooltip" className="tl-action-tooltip" style={position}
      onMouseEnter={show} onMouseLeave={hideLater}>{label}{description && <span className="block font-normal">{description}</span>}</span>, document.body)}
  </>;
}
IconButton.propTypes = {
  icon: PropTypes.string.isRequired, label: PropTypes.string.isRequired, description: PropTypes.string,
  variant: PropTypes.string, onClick: PropTypes.func, onKeyDown: PropTypes.func,
};
