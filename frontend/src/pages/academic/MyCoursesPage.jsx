import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { academicApi } from '../../api/academicApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import Pagination from '../../components/academic/Pagination';
import TeacherActivities from '../../components/academic/TeacherActivities';

const messageOf = error => error?.response?.data?.message || error?.response?.data?.error || 'No pudimos cargar tus materias.';

export default function MyCoursesPage({ role }) {
  const [activityGroup, setActivityGroup] = useState(null);
  const [q, setQ] = useState(''); const [page, setPage] = useState(0); const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [expanded, setExpanded] = useState(null);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setResult(await (role === 'DOCENTE' ? academicApi.teacherCourses({ q, page, size: 10 }) : academicApi.studentCourses({ q, page, size: 10 }))); } catch (failure) { setError(messageOf(failure)); } finally { setLoading(false); } }, [page, q, role]);
  useEffect(() => { load(); }, [load]);
  return <div className="space-y-6"><PageHeader title="Mis materias" description={role === 'DOCENTE' ? 'Grupos en los que tienes una asignación docente vigente.' : 'Grupos en los que mantienes una inscripción activa.'} /><Card><Field id={`${role.toLowerCase()}-courses-search`} label="Buscar materia o grupo">{props => <input {...props} type="search" className="tl-input" value={q} onChange={event => { setQ(event.target.value); setPage(0); }} />}</Field></Card>{loading && !result ? <LoadingState label="Cargando tus materias…" /> : error && !result ? <ErrorState message={error} onRetry={load} /> : !result?.content.length ? <EmptyState title={q ? 'No hay resultados para esta búsqueda.' : 'No tienes materias activas.'} description={q ? 'Prueba otro término.' : role === 'DOCENTE' ? 'Un administrador debe asignarte a un grupo.' : 'Un administrador debe inscribirte en un grupo.'} /> : <div className="grid gap-4 lg:grid-cols-2">{result.content.map(item => <Card key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-blue-700">{item.code}</p><h2 className="text-lg font-semibold">{item.courseName}</h2><p className="text-sm text-slate-600">{item.name} · {item.periodName}</p></div><Button variant="secondary" aria-expanded={expanded === item.id} onClick={() => setExpanded(current => current === item.id ? null : item.id)}>{expanded === item.id ? 'Ocultar' : 'Ver detalle'}</Button></div>{role === 'DOCENTE' && <Button className="mt-4" onClick={() => setActivityGroup(item)}>Ver actividades</Button>}{expanded === item.id && <dl className="mt-4 grid gap-2 border-t pt-4 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Materia</dt><dd>{item.courseName}</dd></div><div><dt className="font-semibold">Grupo</dt><dd>{item.code} · {item.name}</dd></div><div><dt className="font-semibold">Periodo</dt><dd>{item.periodName}</dd></div></dl>}</Card>)}</div>}{result?.content.length > 0 && <Card className="p-0"><Pagination result={result} page={page} loading={loading} onPage={setPage} /></Card>}{activityGroup && role === 'DOCENTE' && <TeacherActivities key={activityGroup.id} group={activityGroup} onClose={() => setActivityGroup(null)} />}</div>;
}
MyCoursesPage.propTypes = { role: PropTypes.oneOf(['DOCENTE', 'ESTUDIANTE']).isRequired };
