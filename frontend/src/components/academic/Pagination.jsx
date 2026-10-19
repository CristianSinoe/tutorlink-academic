import { useId } from 'react';
import PropTypes from 'prop-types';
import Button from '../ui/Button';

export default function Pagination({ result, page, loading, onPage, label = 'Paginación' }) {
  const id = useId();
  const total = Math.max(1, result?.totalPages ?? Math.ceil((result?.totalElements || 0) / (result?.size || 10)));
  const pages = [...new Set([0, total - 1, ...Array.from({ length: 5 }, (_, i) => page + i - 2).filter(value => value >= 0 && value < total)])].sort((a, b) => a - b);
  return <nav aria-label={label} className="tl-pagination flex flex-col items-center justify-center gap-3 border-t p-4 text-sm">
    <p aria-live="polite">{result ? `${result.totalElements ?? 0} resultado(s) · ` : ''}Página {page + 1} de {total}</p>
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="secondary" disabled={page <= 0 || loading} onClick={() => onPage(page - 1)}>Anterior</Button>
      {pages.map((value, index) => <span key={value} className="inline-flex items-center gap-2">{index > 0 && value - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}<Button variant={value === page ? 'primary' : 'secondary'} aria-label={`Página ${value + 1}`} aria-current={value === page ? 'page' : undefined} disabled={loading} onClick={() => onPage(value)}>{value + 1}</Button></span>)}
      <Button variant="secondary" disabled={!result || page + 1 >= total || loading} onClick={() => onPage(page + 1)}>Siguiente</Button>
    </div>
    <form className="flex items-center justify-center gap-2" onSubmit={event => { event.preventDefault(); const target = Number(new FormData(event.currentTarget).get('page')); if (Number.isInteger(target) && target >= 1 && target <= total) onPage(target - 1); }}>
      <label htmlFor={id}>Ir a página</label><input key={`${page}-${total}`} id={id} name="page" type="number" min="1" max={total} defaultValue={page + 1} required disabled={loading} className="tl-input w-20" /><Button type="submit" variant="secondary" disabled={loading}>Ir</Button>
    </form>
  </nav>;
}
Pagination.propTypes = { result: PropTypes.object, page: PropTypes.number.isRequired, loading: PropTypes.bool, onPage: PropTypes.func.isRequired, label: PropTypes.string };
