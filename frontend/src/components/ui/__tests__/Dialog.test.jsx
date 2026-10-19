import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import Dialog from '../Dialog';
import { AdminPresentationContext } from '../../../context/AdminPresentationContext';

function Example({ busy = false, onClose }) {
  const [open, setOpen] = useState(false); const [value, setValue] = useState('');
  const close = () => { onClose(); setOpen(false); };
  return <AdminPresentationContext.Provider value={true}><div data-context-background><button onClick={() => setOpen(true)}>Abrir edición</button></div>{open && <Dialog title="Editar datos" size="profile" dirty={Boolean(value)} busy={busy} onClose={close} footer={<button data-dialog-close onClick={close}>Cerrar</button>}><label htmlFor="draft">Nombre</label><input id="draft" value={value} onChange={event => setValue(event.target.value)} /></Dialog>}</AdminPresentationContext.Provider>;
}
it('preserves draft and focus when cancelling a discard, then restores the opener on discard', async () => {
  const user = userEvent.setup(); const close = vi.fn(); render(<Example onClose={close} />);
  await user.click(screen.getByText('Abrir edición'));
  expect(document.body.style.overflow).toBe('hidden');
  await user.type(screen.getByLabelText('Nombre'), 'Ana');
  await user.keyboard('{Escape}'); expect(screen.getByText('Seguir editando')).toHaveFocus();
  await user.click(screen.getByText('Seguir editando')); expect(screen.getByLabelText('Nombre')).toHaveValue('Ana');
  await user.click(screen.getByText('Cerrar')); await user.click(screen.getByText('Descartar cambios'));
  expect(close).toHaveBeenCalledTimes(1); expect(screen.getByText('Abrir edición')).toHaveFocus();
  expect(document.body.style.overflow).toBe(''); expect(document.querySelector('[data-context-background]')).not.toHaveAttribute('inert');
});
it('does not close via Escape or footer while a write is pending', async () => {
  const user = userEvent.setup(); const close = vi.fn(); render(<Example busy onClose={close} />);
  await user.click(screen.getByText('Abrir edición')); await user.keyboard('{Escape}'); await user.click(screen.getByText('Cerrar'));
  expect(close).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Cerrar ventana' })).toBeDisabled();
});
it('does not reset focus to the close button as the parent renders a new callback while typing', async () => {
  const user = userEvent.setup(); render(<Example onClose={vi.fn()} />); await user.click(screen.getByText('Abrir edición'));
  await user.type(screen.getByLabelText('Nombre'), 'Una persona'); expect(screen.getByLabelText('Nombre')).toHaveFocus();
});
it('keeps the legacy presentation outside the administrative provider', () => {
  render(<Dialog title="Consulta de estudiante" onClose={vi.fn()}>Contenido</Dialog>);
  expect(screen.getByRole('dialog')).not.toHaveClass('tl-dialog-admin'); expect(document.body.style.overflow).toBe('');
});
