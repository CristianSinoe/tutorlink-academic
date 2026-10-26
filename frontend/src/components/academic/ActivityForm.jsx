import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { academicApi } from '../../api/academicApi';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { Alert } from '../ui/States';

const localTime = value => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export default function ActivityForm({ kind, groupId, item, onSaved, onCancel, onDirty, onBusy }) {
  const task = kind === 'tasks';
  const [form, setForm] = useState({ title: item?.title || '', text: (task ? item?.instructions : item?.body) || '', dueAt: localTime(item?.dueAt), published: item?.published || false, allowLateSubmissions: item?.allowLateSubmissions || false });
  const [error, setError] = useState('');
  const errorMessage = useRef(null);
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  const [discard, setDiscard] = useState(false);
  useEffect(() => { if (error) { errorMessage.current?.scrollIntoView?.({ block: 'center' }); errorMessage.current?.focus({ preventScroll: true }); } }, [error]);
  const update = (key, value) => { setForm(current => ({ ...current, [key]: value })); setChanged(true); onDirty(true); };
  const submit = async event => {
    event.preventDefault();
    if (!form.title.trim()) { setError('Escribe un título para la actividad.'); return; }
    if (task && !Number.isFinite(new Date(form.dueAt).getTime())) { setError('Indica una fecha y hora límite válidas.'); return; }
    setBusy(true); onBusy(true); setError('');
    const payload = { title: form.title.trim(), published: form.published, [task ? 'instructions' : 'body']: form.text };
    if (task) { payload.dueAt = new Date(form.dueAt).toISOString(); payload.allowLateSubmissions = form.allowLateSubmissions; }
    try { await academicApi.saveActivity(kind, groupId, payload, item?.id); onDirty(false); onSaved(); }
    catch (failure) { setError(failure?.response?.data?.message || failure?.response?.data?.error || 'No pudimos guardar la actividad. Conservamos tus datos; comprueba el listado antes de repetir una operación incierta.'); }
    finally { setBusy(false); onBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-5">
    <h3 className="text-lg font-semibold">{item ? 'Editar' : 'Crear'} {task ? 'tarea' : 'clase o material'}</h3>
    {error && <Alert ref={errorMessage} tabIndex={-1} tone="error">{error}</Alert>}
    <fieldset disabled={busy} className="tl-form-grid">
      <div className="tl-form-span"><Field id="activity-title" label="Título" required>{props => <input {...props} autoFocus className="tl-input" required maxLength={200} value={form.title} onChange={event => update('title', event.target.value)} />}</Field></div>
      <div className="tl-form-span"><Field id="activity-text" label={task ? 'Instrucciones' : 'Contenido'}>{props => <textarea {...props} className="tl-input min-h-40" maxLength={20000} value={form.text} onChange={event => update('text', event.target.value)} />}</Field></div>
      {task && <Field id="activity-due" label="Fecha límite" hint="Fecha y hora de este dispositivo; se envían con su zona horaria." required>{props => <input {...props} type="datetime-local" className="tl-input" required value={form.dueAt} onChange={event => update('dueAt', event.target.value)} />}</Field>}
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.published} onChange={event => update('published', event.target.checked)} />Publicada para estudiantes</label>
      {task && <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.allowLateSubmissions} onChange={event => update('allowLateSubmissions', event.target.checked)} />Permitir entregas tardías</label>}
    </fieldset>
    <p className="text-sm text-slate-600">El grupo y la autoría se conservan. No se pueden ocultar tareas que ya tienen entregas o borradores.</p>
    {discard && <section role="alert"><p>¿Descartar los cambios de esta actividad?</p><div className="mt-3 flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={() => setDiscard(false)}>Seguir editando</Button><Button type="button" variant="danger" onClick={onCancel}>Descartar edición</Button></div></section>}
    <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" type="button" disabled={busy} onClick={() => changed ? setDiscard(true) : onCancel()}>Cancelar edición</Button><Button type="submit" busy={busy}>Guardar actividad</Button></div>
  </form>;
}
ActivityForm.propTypes = { kind: PropTypes.string.isRequired, groupId: PropTypes.number.isRequired, item: PropTypes.object, onSaved: PropTypes.func.isRequired, onCancel: PropTypes.func.isRequired, onDirty: PropTypes.func.isRequired, onBusy: PropTypes.func.isRequired };
