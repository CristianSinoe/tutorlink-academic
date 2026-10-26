import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { academicApi } from '../../api/academicApi';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Table from '../ui/Table';
import { EmptyState, ErrorState, LoadingState } from '../ui/States';
import Pagination from './Pagination';
import { formatDateTime } from '../../utils/dateUtils';
import SubmissionFiles from './SubmissionFiles';

export default function TaskStudents({ task, onBack }) {
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState(''); const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0); const [response, setResponse] = useState(null);
  const key = JSON.stringify([task.id, status, q, page, retry]);
  const loading = response?.key !== key;
  useEffect(() => {
    let active = true;
    academicApi.taskStudents(task.id, { status, q, page, size: 5 }).then(result => { if (active) setResponse({ key, result }); })
      .catch(() => { if (active) setResponse({ key, error: 'No pudimos consultar las entregas autorizadas de esta tarea.' }); });
    return () => { active = false; };
  }, [task.id, status, q, page, key]);
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">Entregas · {task.title}</h3><Button variant="secondary" onClick={onBack}>Volver a actividades</Button></div>
    <p className="text-sm text-slate-600">Estudiantes con inscripción y membresía activas. Pendiente significa que no existe una entrega final; los borradores permanecen privados.</p>
    <div className="grid gap-4 sm:grid-cols-2"><Field id="submission-search" label="Buscar estudiante o matrícula">{props => <input {...props} type="search" className="tl-input" value={q} onChange={event => { setQ(event.target.value); setPage(0); }} />}</Field><Field id="submission-status" label="Estado de entrega">{props => <select {...props} className="tl-input" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="ALL">Todos</option><option value="PENDING">Pendiente</option><option value="ON_TIME">A tiempo</option><option value="LATE">Tardía</option></select>}</Field></div>
    {loading ? <LoadingState label="Cargando entregas…" /> : response.error ? <ErrorState message={response.error} onRetry={() => setRetry(value => value + 1)} /> : !response.result.content.length ? <EmptyState title="No hay estudiantes para estos filtros." /> : <><Table label="Entregas de estudiantes"><thead><tr><th scope="col">Estudiante</th><th scope="col">Matrícula</th><th scope="col">Estado</th><th scope="col">Entrega</th></tr></thead><tbody>{response.result.content.map(row => <tr key={row.studentId} className="border-t"><td>{[row.name, row.lastNamePaterno, row.lastNameMaterno].filter(Boolean).join(' ')}</td><td>{row.matricula}</td><td><Badge tone={row.status === 'PENDING' ? 'warning' : row.status === 'LATE' ? 'info' : 'success'}>{({ PENDING: 'Pendiente', ON_TIME: 'A tiempo', LATE: 'Tardía' })[row.status]}</Badge>{row.submittedAt && <p className="mt-2 text-xs">{formatDateTime(row.submittedAt)}</p>}</td><td>{row.submissionId ? <details><summary className="cursor-pointer font-semibold text-uvBlue">Ver entrega</summary><p className="mt-3 whitespace-pre-wrap break-words">{row.body || 'Entrega sin texto.'}</p><SubmissionFiles submissionId={row.submissionId} /></details> : 'Aún no entregada'}</td></tr>)}</tbody></Table><Pagination result={response.result} page={page} loading={loading} onPage={setPage} /></>}
  </section>;
}
TaskStudents.propTypes = { task: PropTypes.shape({ id: PropTypes.number.isRequired, title: PropTypes.string }).isRequired, onBack: PropTypes.func.isRequired };
