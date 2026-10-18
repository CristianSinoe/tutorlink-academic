import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { academicApi } from '../../api/academicApi';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Dialog from '../../components/ui/Dialog';
import Field from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import Pagination from '../../components/academic/Pagination';

const definitions = {
  periods: { title: 'Periodos académicos', singular: 'periodo', description: 'Define los intervalos en los que se imparten los grupos.', empty: { code: '', name: '', startsOn: '', endsOn: '' } },
  courses: { title: 'Cursos y materias', singular: 'curso', description: 'Administra el catálogo de materias de la institución activa.', empty: { code: '', name: '', description: '' } },
};
const messageOf = error => error?.response?.data?.message || error?.response?.data?.error || 'No pudimos completar la operación.';

function CreateCatalogDialog({ kind, onClose, onCreated, item = null }) {
  const definition = definitions[kind];
  const [form, setForm] = useState(item ? { ...definition.empty, ...item } : definition.empty); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const submit = async event => {
    event.preventDefault(); setError('');
    if (!form.code.trim() || !form.name.trim()) { setError('Código y nombre son obligatorios.'); return; }
    if (kind === 'periods' && (!form.startsOn || !form.endsOn || form.endsOn < form.startsOn)) { setError('La fecha final debe ser igual o posterior a la fecha inicial.'); return; }
    setBusy(true);
    try { if (item) { if (kind === 'periods') await academicApi.updatePeriod(item.id, { code: form.code, name: form.name, startsOn: form.startsOn, endsOn: form.endsOn, status: form.status }); else await academicApi.updateCourse(item.id, { code: form.code, name: form.name, description: form.description, active: form.active }); } else if (kind === 'periods') await academicApi.createPeriod(form); else await academicApi.createCourse(form); await onCreated(); onClose(); }
    catch (failure) { setError(messageOf(failure)); } finally { setBusy(false); }
  };
  return <Dialog title={`${item ? 'Detalles del' : 'Crear'} ${definition.singular}`} onClose={onClose}><form className="space-y-4" onSubmit={submit}>
    {error && <Alert tone="error">{error}</Alert>}
    <Field id={`${kind}-code`} label="Código" required>{props => <input {...props} className="tl-input" maxLength="50" value={form.code} onChange={event => update('code', event.target.value)} />}</Field>
    <Field id={`${kind}-name`} label="Nombre" required>{props => <input {...props} className="tl-input" maxLength={kind === 'periods' ? 140 : 180} value={form.name} onChange={event => update('name', event.target.value)} />}</Field>
    {kind === 'periods' ? <div className="grid gap-4 sm:grid-cols-2"><Field id="period-start" label="Fecha inicial" required>{props => <input {...props} type="date" className="tl-input" value={form.startsOn} onChange={event => update('startsOn', event.target.value)} />}</Field><Field id="period-end" label="Fecha final" required>{props => <input {...props} type="date" className="tl-input" value={form.endsOn} onChange={event => update('endsOn', event.target.value)} />}</Field></div>
      : <Field id="course-description" label="Descripción">{props => <textarea {...props} className="tl-input min-h-24" value={form.description} onChange={event => update('description', event.target.value)} />}</Field>}
    {item && <Field id={`${kind}-state`} label="Estado">{props => <select {...props} className="tl-input" value={kind === 'periods' ? form.status : String(form.active)} onChange={event => update(kind === 'periods' ? 'status' : 'active', kind === 'periods' ? event.target.value : event.target.value === 'true')}><option value={kind === 'periods' ? 'ACTIVE' : 'true'}>Activo</option><option value={kind === 'periods' ? 'INACTIVE' : 'false'}>Inactivo</option></select>}</Field>}
    <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" busy={busy}>{item ? 'Guardar cambios' : 'Crear'}</Button></div>
  </form></Dialog>;
}
CreateCatalogDialog.propTypes = { kind: PropTypes.oneOf(['periods', 'courses']).isRequired, item: PropTypes.object, onClose: PropTypes.func.isRequired, onCreated: PropTypes.func.isRequired };

export default function AcademicCatalogPage({ kind }) {
  const definition = definitions[kind];
  const [q, setQ] = useState(''); const [page, setPage] = useState(0); const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [open, setOpen] = useState(false); const [selected, setSelected] = useState(null);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setResult(await academicApi.adminList(kind, { q, page, size: 10 })); } catch (failure) { setError(messageOf(failure)); } finally { setLoading(false); } }, [kind, page, q]);
  useEffect(() => { load(); }, [load]);
  return <div className="space-y-6"><PageHeader title={definition.title} description={definition.description} actions={<Button onClick={() => setOpen(true)}>Crear {definition.singular}</Button>} />
    <Card><Field id={`${kind}-search`} label="Buscar por código o nombre">{props => <input {...props} type="search" className="tl-input" value={q} onChange={event => { setQ(event.target.value); setPage(0); }} />}</Field></Card>
    {loading && !result ? <LoadingState /> : error && !result ? <ErrorState message={error} onRetry={load} /> : <Card className="p-0">{error && <Alert className="m-4">{error}</Alert>}{!result?.content.length ? <EmptyState title={`No hay ${definition.title.toLowerCase()} con estos filtros.`} /> : <Table label={definition.title}><thead className="bg-slate-50"><tr><th>Código</th><th>Nombre</th>{kind === 'periods' ? <><th>Inicio</th><th>Fin</th><th>Estado</th></> : <><th>Descripción</th><th>Estado</th></>}<th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{result.content.map(item => <tr className="border-t" key={item.id}><td>{item.code}</td><td>{item.name}</td>{kind === 'periods' ? <><td>{item.startsOn}</td><td>{item.endsOn}</td><td><Badge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status}</Badge></td></> : <><td>{item.description || '—'}</td><td><Badge tone={item.active ? 'success' : 'neutral'}>{item.active ? 'Activo' : 'Inactivo'}</Badge></td></>}<td><Button variant="secondary" onClick={() => setSelected(item)}>Ver detalles</Button></td></tr>)}</tbody></Table>}<Pagination result={result} page={page} loading={loading} onPage={setPage} /></Card>}
    {selected && <CreateCatalogDialog kind={kind} item={selected} onClose={() => setSelected(null)} onCreated={load} />}
    {open && <CreateCatalogDialog kind={kind} onClose={() => setOpen(false)} onCreated={load} />}
  </div>;
}
AcademicCatalogPage.propTypes = { kind: PropTypes.oneOf(['periods', 'courses']).isRequired };
