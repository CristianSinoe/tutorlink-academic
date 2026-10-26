import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import IconButton from '../IconButton';
import Dialog from '../Dialog';

describe('Acciones compactas compartidas', () => {
  it('conserva nombre accesible, icono decorativo y evita enviar formularios', async () => {
    const user = userEvent.setup(); const action = vi.fn(); const submit = vi.fn(e => e.preventDefault());
    render(<form onSubmit={submit}><IconButton icon="trash" label="Quitar asignación" description="Estudiante de prueba; su cuenta se conserva." onClick={action} /></form>);
    const button = screen.getByRole('button', { name: 'Quitar asignación' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await user.click(button);
    expect(action).toHaveBeenCalledOnce(); expect(submit).not.toHaveBeenCalled();
  });
  it('muestra ayuda con teclado y Escape la cierra antes que el diálogo', async () => {
    const user = userEvent.setup(); const close = vi.fn();
    render(<Dialog title="Asignaciones" onClose={close}><IconButton icon="trash" label="Quitar asignación" description="Estudiante de prueba" /></Dialog>);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Quitar asignación' })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Estudiante de prueba');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
    await user.keyboard('{Escape}'); expect(close).toHaveBeenCalledOnce();
  });
  it('mantiene la geometría y bloquea interacciones mientras procesa', async () => {
    const user = userEvent.setup(); const action = vi.fn();
    render(<IconButton icon="trash" label="Quitar asignación" busy onClick={action} />);
    const button = screen.getByRole('button', { name: 'Quitar asignación' });
    expect(button).toHaveClass('tl-button-icon-only');
    expect(button).toBeDisabled(); expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button); expect(action).not.toHaveBeenCalled();
  });
});
