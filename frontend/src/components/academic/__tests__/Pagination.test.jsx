import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import Pagination from '../Pagination';
function Example() {
  const [page, onPage] = useState(0);
  return <Pagination result={{ totalElements: 200, totalPages: 10 }} page={page} onPage={onPage} />;
}
it('jumps directly to page ten, marks the current page and supports a keyboard jump', async () => {
  const user = userEvent.setup(); render(<Example />);
  await user.click(screen.getByRole('button', { name: 'Página 10' }));
  expect(screen.getByRole('button', { name: 'Página 10' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await user.clear(screen.getByLabelText('Ir a página'));
  await user.type(screen.getByLabelText('Ir a página'), '4{Enter}');
  expect(screen.getByRole('button', { name: 'Página 4' })).toHaveAttribute('aria-current', 'page');
});
it('disables all navigation while loading', () => {
  const onPage = vi.fn(); render(<Pagination result={{ totalPages: 10 }} page={0} loading onPage={onPage} />);
  expect(screen.getByRole('button', { name: 'Página 10' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Ir' })).toBeDisabled();
});
