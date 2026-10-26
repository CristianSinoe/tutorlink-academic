import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../api/axiosClient';
import Button from '../ui/Button';
import { Alert, LoadingState } from '../ui/States';

export default function SubmissionFiles({ submissionId }) {
  const [requested, setRequested] = useState(false);
  const [page, setPage] = useState(0); const [state, setState] = useState(null);
  const [links, setLinks] = useState({}); const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!requested) return;
    let active = true;
    apiClient.get('/api/attachments', { params: { resourceType: 'SUBMISSION', resourceId: submissionId, actingRole: 'DOCENTE', page, size: 5 } }).then(({ data }) => {
      if (!Array.isArray(data)) throw new Error('Invalid references');
      if (active) setState({ page, files: data });
    }).catch(() => { if (active) setState({ page, error: 'No pudimos consultar las referencias de esta entrega.' }); });
    return () => { active = false; };
  }, [requested, submissionId, page, retry]);
  const open = async id => {
    setBusy(id); setError('');
    try {
      const { data } = await apiClient.get(`/api/attachments/${id}/content-reference`, { params: { actingRole: 'DOCENTE' } });
      if (new URL(data.url).protocol !== 'https:') throw new Error('Invalid reference');
      setLinks(current => ({ ...current, [id]: data.url }));
    } catch { setError('La referencia no está disponible o su procedencia no está aprobada. Puedes consultar sus metadatos.'); }
    finally { setBusy(null); }
  };
  if (!requested) return <Button className="mt-3" variant="secondary" onClick={() => setRequested(true)}>Consultar archivos referenciados</Button>;
  return <div className="mt-3 space-y-3">
    {state?.page !== page ? <LoadingState label="Consultando archivos…" /> : state.error ? <Alert tone="error">{state.error}<Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Reintentar referencias</Button></Alert> : <>
      {!state.files.length ? <p>No hay archivos referenciados.</p> : <ul className="space-y-3">{state.files.map(file => <li key={file.id}><p className="break-words font-semibold">{file.fileName}</p><p>{file.mimeType || 'Tipo no indicado'}</p>{links[file.id] ? <a className="tl-button-secondary" href={links[file.id]} target="_blank" rel="noopener noreferrer">Abrir referencia autorizada</a> : <Button variant="secondary" busy={busy === file.id} disabled={busy !== null} onClick={() => open(file.id)}>Consultar referencia</Button>}</li>)}</ul>}
      {error && <Alert tone="error">{error}</Alert>}
      <nav aria-label="Páginas de referencias" className="flex flex-wrap items-center justify-center gap-3"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(value => value - 1)}>Referencias anteriores</Button><span>Página {page + 1}</span><Button variant="secondary" disabled={state.files.length < 5} onClick={() => setPage(value => value + 1)}>Referencias siguientes</Button></nav>
      <p className="text-xs text-slate-600">Se muestran referencias registradas; TutorLink no almacena ni sube archivos en esta vista.</p>
    </>}
  </div>;
}
SubmissionFiles.propTypes = { submissionId: PropTypes.number.isRequired };
