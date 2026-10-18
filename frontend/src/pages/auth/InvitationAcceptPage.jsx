import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axiosClient';
import { useAuth } from '../../context/useAuth';
import Logo from '../../components/Logo';
import { readInvitation, rememberInvitation, forgetInvitation } from '../../context/invitationMemory';

export default function InvitationAcceptPage() {
  const { auth, logout, retryRestore } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => new URLSearchParams(location.search).get('token') || readInvitation());
  const [mode, setMode] = useState('existing');
  const [form, setForm] = useState({ name: '', lastNamePaterno: '', lastNameMaterno: '', password: '', confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const heading = useRef(null);
  useEffect(() => {
    if (token) rememberInvitation(token);
    if (location.search || location.state) navigate(location.pathname, { replace: true, state: null });
  }, [token, location.search, location.state, location.pathname, navigate]);
  useEffect(() => { if (success) heading.current?.focus(); }, [success]);
  const submit = async event => {
    event.preventDefault(); setError('');
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) { setError('El enlace no es válido. Reabre la invitación recibida o solicita una nueva.'); return; }
    if (!auth.token && (form.password.length < 8 || (mode === 'new' && form.password !== form.confirmation))) {
      setError('Revisa tu contraseña: mínimo ocho caracteres y confirmación coincidente para una cuenta nueva.'); return;
    }
    setBusy(true);
    try {
      const payload = auth.token ? { token } : mode === 'existing' ? { token, password: form.password }
        : { token, name: form.name.trim(), lastNamePaterno: form.lastNamePaterno.trim(), lastNameMaterno: form.lastNameMaterno.trim(), password: form.password };
      const { data } = await apiClient.post('/api/institution-invitations/accept', payload);
      if (!Number.isSafeInteger(data?.userId) || !Array.isArray(data.roles)) throw new Error('Respuesta inválida');
      forgetInvitation(); setToken(''); setForm({ name: '', lastNamePaterno: '', lastNameMaterno: '', password: '', confirmation: '' }); setSuccess(true);
    } catch (failure) {
      const status = failure.response?.status;
      setError(status === 400 ? 'Revisa los datos requeridos para aceptar la invitación.' : status === 403
        ? 'No pudimos verificar esta invitación o cuenta. Puede haber vencido, estar cancelada o haberse utilizado. Revisa tu cuenta o solicita una nueva invitación al administrador.'
        : 'No pudimos confirmar la aceptación. Revisa tu acceso antes de reintentar; no se ha iniciado una sesión automáticamente.');
    } finally { setBusy(false); }
  };
  const updatedOptions = async () => {
    setBusy(true); setError('');
    try { await retryRestore(); navigate('/context'); } catch { setError('No pudimos actualizar tus instituciones. Inicia sesión nuevamente si tu contexto ya no está vigente.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-xl px-4 py-8 text-slate-900">
    <Logo className="mb-6 w-40" />
    <h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold text-uvBlue">{success ? 'Invitación aceptada' : 'Aceptar invitación institucional'}</h1>
    {error && <p role="alert" id="invitation-error" className="tl-error my-4">{error}</p>}
    {success ? <section className="mt-4"><p role="status">Tu vinculación se guardó. La aceptación no inicia una sesión nueva.</p>
      {auth.token ? <button className="tl-button-primary mt-4" disabled={busy} onClick={updatedOptions}>Actualizar instituciones y elegir contexto</button>
        : <Link className="tl-button-primary mt-4" to="/login">Iniciar sesión</Link>}</section>
      : !token ? <p className="my-4">Reabre el enlace original del correo. Por seguridad, la prueba no se conserva al recargar esta página.</p>
      : <section className="mt-4 rounded-xl border border-slate-300 bg-white p-5">
        <p className="mb-4">El servidor verificará la invitación y vinculará únicamente la cuenta autorizada. El contacto institucional no cambia tu correo principal.</p>
        {auth.loading && <p role="status">Verificando tu sesión…</p>}
        {auth.error && <p role="alert">No se pudo verificar tu sesión. Puedes usar otra cuenta para continuar.</p>}
        {auth.token ? <div className="mb-4"><p>Cuenta actual: <strong>{auth.email}</strong></p><button type="button" className="tl-button-secondary mt-2" disabled={busy || auth.switching} onClick={logout}>Usar otra cuenta</button></div>
          : <><label className="block font-semibold" htmlFor="invitation-mode">Tu cuenta</label><select id="invitation-mode" className="tl-input mb-4" value={mode} disabled={busy} onChange={e => { setMode(e.target.value); setError(''); }}>
            <option value="existing">Ya tengo cuenta</option><option value="new">Crear cuenta</option></select>
            <p className="mb-4 text-sm">Si ya tienes cuenta con otro correo principal, <Link className="text-uvBlue underline" to="/login?next=%2Faccept-institution-invitation">inicia sesión para vincularla</Link>. No crees una segunda cuenta.</p></>}
        <form onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={busy || auth.loading || auth.switching || Boolean(auth.error)} className="space-y-4">
            {!auth.token && <>
              {mode === 'new' && [['name', 'Nombre'], ['lastNamePaterno', 'Primer apellido'], ['lastNameMaterno', 'Segundo apellido (opcional)']].map(([field, label]) => <div key={field}>
                <label htmlFor={`invite-${field}`} className="block font-semibold">{label}</label><input id={`invite-${field}`} className="tl-input" maxLength={120} required={field !== 'lastNameMaterno'} autoComplete={field === 'name' ? 'given-name' : 'family-name'} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} /></div>)}
              <div><label htmlFor="invite-password" className="block font-semibold">Contraseña</label><input id="invite-password" className="tl-input" type="password" minLength={8} maxLength={255} required autoComplete={mode === 'new' ? 'new-password' : 'current-password'} value={form.password} aria-describedby={error ? 'invitation-error' : undefined} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              {mode === 'new' && <div><label htmlFor="invite-confirmation" className="block font-semibold">Confirmar contraseña</label><input id="invite-confirmation" className="tl-input" type="password" required autoComplete="new-password" value={form.confirmation} onChange={e => setForm({ ...form, confirmation: e.target.value })} /></div>}
            </>}
            <button className="tl-button-primary" type="submit">{busy ? 'Verificando invitación…' : 'Aceptar invitación'}</button>
          </fieldset>
        </form>
      </section>}
  </main>;
}
