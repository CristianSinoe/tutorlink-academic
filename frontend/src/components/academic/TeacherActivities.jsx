import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { academicApi } from '../../api/academicApi';
import ActivityForm from './ActivityForm';
import TaskStudents from './TaskStudents';
import IconButton from '../ui/IconButton';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Dialog from '../ui/Dialog';
import Field from '../ui/Field';
import { Alert, EmptyState, ErrorState, LoadingState } from '../ui/States';
import Pagination from './Pagination';
import { formatDateTime } from '../../utils/dateUtils';

export default function TeacherActivities({ group, onClose }) {
  const deleteTrigger = useRef(null);
  const errorMessage = useRef(null);
  const successMessage = useRef(null);
  const [editor, setEditor] = useState(null);
  const [taskSelected, setTaskSelected] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [kind, setKind] = useState('tasks');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [response, setResponse] = useState(null);
  const queryKey = JSON.stringify([kind, group.id, q, page, retry]);
  const loading = response?.key !== queryKey;
  const result = loading ? null : response.result;
  const error = loading ? '' : response.error;
  useEffect(() => {
    const target = actionError ? errorMessage.current : notice ? successMessage.current : null;
    target?.scrollIntoView?.({ block: 'center' });
    target?.focus({ preventScroll: true });
  }, [actionError, notice]);
  useEffect(() => {
    let current = true;
    academicApi.teacherActivities(kind, group.id, { q, page, size: 5 }).then(data => {
      if (current) setResponse({ key: queryKey, result: data, error: '' });
    }).catch(failure => {
      if (current) setResponse({ key: queryKey, result: null, error: failure?.response?.status === 403 ? 'No tienes acceso a las actividades de este grupo.' : 'No pudimos cargar las actividades. Intenta nuevamente.' });
    });
    return () => { current = false; };
  }, [kind, group.id, q, page, queryKey]);
  const remove = async () => {
    setBusy(true); setActionError('');
    try { await academicApi.deleteActivity(kind, confirmDelete.id); setConfirmDelete(null); setNotice('Actividad eliminada.'); setRetry(value => value + 1); }
    catch (failure) { setActionError(failure?.response?.data?.message || failure?.response?.data?.error || 'No pudimos eliminar la actividad. Comprueba su estado antes de repetir.'); }
    finally { setBusy(false); }
  };
  const cancelDelete = () => {
    setConfirmDelete(null);
    deleteTrigger.current?.scrollIntoView?.({ block: 'center' });
    deleteTrigger.current?.focus({ preventScroll: true });
  };
  return <Dialog title={`Actividades · ${group.courseName}`} size="management" dirty={dirty} busy={busy} onClose={onClose}
    footer={<Button data-dialog-close variant="secondary" disabled={busy} onClick={onClose}>Cerrar</Button>}>
    <div className="space-y-5">
      <div className="tl-detail-summary"><p className="font-semibold">{group.code} · {group.name}</p><p>{group.periodName}</p><p className="text-sm">Consulta las tareas y los materiales disponibles en tu grupo. Los borradores visibles dependen de tu autoría y permisos.</p></div>
      {notice && <Alert ref={successMessage} tabIndex={-1} tone="success">{notice}</Alert>}
      {actionError && <Alert ref={errorMessage} tabIndex={-1} tone="error">{actionError}</Alert>}
      {editor ? <ActivityForm key={editor.item?.id || 'new'} kind={kind} groupId={group.id} item={editor.item} onBusy={setBusy} onDirty={setDirty}
        onCancel={() => { setEditor(null); setDirty(false); }} onSaved={() => { setEditor(null); setNotice('Actividad guardada.'); setRetry(value => value + 1); }} />
      : taskSelected ? <TaskStudents task={taskSelected} onBack={() => setTaskSelected(null)} /> : <>
      <div className="flex flex-wrap items-center justify-between gap-3"><Button onClick={() => { setEditor({ item: null }); setActionError(''); setNotice(''); }}>Crear {kind === 'tasks' ? 'tarea' : 'clase o material'}</Button></div>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Tipo de actividad">
        {[['tasks', 'Tareas'], ['contents', 'Clases y materiales']].map(([value, label]) => <Button key={value} variant={kind === value ? 'primary' : 'secondary'} aria-pressed={kind === value} onClick={() => { setKind(value); setPage(0); setConfirmDelete(null); setActionError(''); }}>{label}</Button>)}
      </div>
      <Field id="teacher-activity-search" label="Buscar actividad">{props => <input {...props} className="tl-input" type="search" value={q} onChange={event => { setQ(event.target.value); setPage(0); }} />}</Field>
      {loading ? <LoadingState label="Cargando actividades…" /> : error ? <ErrorState message={error} onRetry={() => setRetry(value => value + 1)} /> : !result?.content.length ? <EmptyState title={q ? 'No hay actividades para esta búsqueda.' : kind === 'tasks' ? 'Este grupo no tiene tareas disponibles.' : 'Este grupo no tiene clases o materiales disponibles.'} description="Solo se muestran registros autorizados por la institución activa." /> : <>
        <div className="grid gap-4 xl:grid-cols-2">{result.content.map(item => <Card key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-semibold">{item.title}</h3><Badge tone={item.published ? 'success' : 'warning'}>{item.published ? 'Publicado' : 'Borrador'}</Badge></div>
          <p className="mt-3 whitespace-pre-wrap break-words">{(kind === 'tasks' ? item.instructions : item.body) || 'Sin descripción.'}</p>
          {kind === 'tasks' && <dl className="mt-4 space-y-2 text-sm"><div><dt className="font-semibold">Fecha límite</dt><dd>{item.dueAt ? formatDateTime(item.dueAt) : 'Sin fecha límite'}</dd></div><div><dt className="font-semibold">Entregas tardías</dt><dd>{item.allowLateSubmissions ? 'Permitidas' : 'No permitidas'}</dd></div></dl>}
          <div className="mt-4 flex flex-wrap gap-3">
            {kind === 'tasks' && <Button variant="secondary" onClick={() => setTaskSelected(item)}>Ver entregas</Button>}
            {item.canManage && <><IconButton icon="edit" label="Editar actividad" description={item.title} onClick={() => { setEditor({ item }); setNotice(''); setActionError(''); }} /><IconButton icon="trash" label="Eliminar actividad" description={item.title} variant="dangerSubtle" onClick={event => { deleteTrigger.current = event.currentTarget; setConfirmDelete(item); setActionError(''); }} /></>}
          </div>
        </Card>)}</div>
        <Pagination result={result} page={page} loading={loading} onPage={setPage} />
      </>}
      {confirmDelete && <section role="alert" className="tl-detail-section mt-4"><h3 className="font-semibold">¿Eliminar «{confirmDelete.title}»?</h3><p className="my-3">Esta acción no se puede deshacer. Las actividades con entregas o referencias históricas se conservarán.</p><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={busy} onClick={cancelDelete}>Cancelar eliminación</Button><Button variant="danger" busy={busy} onClick={remove}>Confirmar eliminación</Button></div></section>}
      </>}
    </div>
  </Dialog>;
}
TeacherActivities.propTypes = { group: PropTypes.shape({ id: PropTypes.number.isRequired, courseName: PropTypes.string, code: PropTypes.string, name: PropTypes.string, periodName: PropTypes.string }).isRequired, onClose: PropTypes.func.isRequired };
