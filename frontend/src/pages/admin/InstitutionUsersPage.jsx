import IconButton from '../../components/ui/IconButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { institutionAdminApi, institutionRoles } from '../../api/institutionAdminApi';
import Button from '../../components/ui/Button';
import ExportActions from '../../components/admin/ExportActions';
import ExcelImportHelp from '../../components/admin/ExcelImportHelp';
import Card from '../../components/ui/Card';
import Dialog from '../../components/ui/Dialog';
import Field from '../../components/ui/Field';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Pagination from '../../components/academic/Pagination';
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/ui/States';

const labels = { ESTUDIANTE: 'Estudiantes', DOCENTE: 'Docentes', TUTOR: 'Tutores' };
const profileFields = {
  ESTUDIANTE: [['code', 'Matrícula'], ['career', 'Carrera'], ['plan', 'Plan'], ['semester', 'Semestre'], ['phone', 'Teléfono']],
  DOCENTE: [['code', 'Código docente'], ['department', 'Departamento'], ['specialty', 'Especialidad'], ['phone', 'Teléfono']],
  TUTOR: [['code', 'Código de tutor'], ['department', 'Departamento'], ['specialty', 'Especialidad'], ['phone', 'Teléfono']],
};
const emptyProfile = () => ({ code: '', department: '', specialty: '', career: '', plan: '', semester: '', phone: '' });
const messageOf = error => error?.response?.data?.message || error?.response?.data?.error || 'No pudimos completar la operación. Inténtalo de nuevo.';
const tone = status => ({ ACTIVE: 'success', SUSPENDED: 'warning', REVOKED: 'error', DISABLED: 'error', BLOCKED: 'error', CREATED_BY_ADMIN: 'warning', PENDING_ACTIVATION: 'warning' }[status] || 'neutral');
const roleTone = role => ({ ESTUDIANTE: 'student', DOCENTE: 'teacher', TUTOR: 'tutor', ADMIN: 'info' }[role] || 'neutral');
const statusLabel = status => ({ ACTIVE: 'Activo', SUSPENDED: 'Suspendido', REVOKED: 'Revocado', DISABLED: 'Desactivado', BLOCKED: 'Bloqueado', CREATED_BY_ADMIN: 'Pendiente de activación', PENDING_ACTIVATION: 'Pendiente de activación' }[status] || status);
const academicDefaults = { career: '', plan: '', semester: '', department: '', specialty: '' };
const exportColumns = [
  { label: 'Nombre', value: row => row.name }, { label: 'Correo principal', value: row => row.email },
  { label: 'Roles', value: row => row.roles.join(', ') }, { label: 'Estado de cuenta', value: row => statusLabel(row.status) },
  ...[['code', 'Código / matrícula'], ['career', 'Carrera'], ['plan', 'Plan'], ['semester', 'Semestre'], ['department', 'Departamento'], ['specialty', 'Especialidad']].map(([field, label]) => ({ label, value: row => row.detail?.profiles?.map(profile => profile[field]).filter(Boolean).join(', ') })),
];
const csvText = file => typeof file.text === 'function' ? file.text() : new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = () => reject(reader.error); reader.readAsText(file); });

function ProfileForm({ role, value, onChange, prefix = 'profile' }) {
  return <div className="grid gap-4 sm:grid-cols-2">{profileFields[role].map(([field, label]) => <Field key={field} id={`${prefix}-${role}-${field}`} label={label} required={field === 'code'}>
    {props => <input {...props} className="tl-input" type={field === 'semester' ? 'number' : 'text'} min={field === 'semester' ? 1 : undefined} max={field === 'semester' ? 20 : undefined} value={value[field] ?? ''} onChange={event => onChange({ ...value, [field]: event.target.value })} />}
  </Field>)}</div>;
}
ProfileForm.propTypes = { role: PropTypes.string.isRequired, value: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired, prefix: PropTypes.string };

function ImportDialog({ role, onClose, onDone }) {
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [report, setReport] = useState(null);
  const submit = async event => {
    event.preventDefault(); setError('');
    if (!file || file.size > 1_000_000 || !/\.(csv|xlsx)$/i.test(file.name)) { setError('Selecciona un archivo CSV o XLSX de hasta 1 MB.'); return; }
    setBusy(true);
    try { const result = /\.csv$/i.test(file.name) ? await institutionAdminApi.importCsv(role, await csvText(file)) : await institutionAdminApi.importExcel(role, file); setReport(result); onDone(); }
    catch (failure) { setError(messageOf(failure)); } finally { setBusy(false); }
  };
  return <Dialog title={`Importar ${labels[role].toLowerCase()}`} size={report ? 'management' : 'form'} dirty={Boolean(file) && !report} busy={busy} onClose={onClose} footer={<Button data-dialog-close variant="secondary" onClick={onClose}>Cerrar</Button>}>
    <form className="space-y-4" onSubmit={submit}>{error && <Alert tone="error">{error}</Alert>}
      <p className="text-sm text-slate-600">Las filas válidas se procesan de forma independiente. El resultado no expone contraseñas ni pruebas de invitación.</p>
      <Field id="institution-import-file" label="Archivo CSV o Excel" required>{props => <input {...props} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="tl-input" onChange={event => setFile(event.target.files?.[0] || null)} />}</Field>
      {!report && <Button type="submit" busy={busy}>Procesar importación</Button>}
      {report && <section aria-live="polite" className="space-y-3"><Alert tone="success">Importación procesada.</Alert><dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5"><Metric label="Creados" value={report.created} /><Metric label="Invitados" value={report.invited} /><Metric label="Omitidos" value={report.skipped} /><Metric label="Fallidos" value={report.failed} /><Metric label="Total" value={report.total} /></dl><Table label="Resultados de importación"><thead><tr><th scope="col">Fila</th><th scope="col">Resultado</th><th scope="col">Mensaje</th></tr></thead><tbody>{report.rows?.map(row => <tr key={`${row.row}-${row.outcome}`} className="border-t"><td>{row.row}</td><td><Badge tone={row.outcome === 'FAILED' ? 'error' : row.outcome === 'SKIPPED' ? 'warning' : 'success'}>{row.outcome}</Badge></td><td>{row.message}</td></tr>)}</tbody></Table></section>}
    </form>
  </Dialog>;
}
ImportDialog.propTypes = { role: PropTypes.string.isRequired, onClose: PropTypes.func.isRequired, onDone: PropTypes.func.isRequired };
function Metric({ label, value }) { return <div className="rounded-lg bg-slate-50 p-2"><dt className="text-xs text-slate-600">{label}</dt><dd className="text-lg font-semibold">{value ?? 0}</dd></div>; }
Metric.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.number };

function UserDialog({ userId, onClose, onChanged }) {
  const [detail, setDetail] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [profile, setProfile] = useState(null); const [roleToAdd, setRoleToAdd] = useState(''); const [roleDraft, setRoleDraft] = useState(emptyProfile()); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(null);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const data = await institutionAdminApi.user(userId); setDetail(data); } catch (failure) { setError(messageOf(failure)); } finally { setLoading(false); } }, [userId]);
  useEffect(() => { load(); }, [load]);
  const mutate = async action => { setBusy(true); setError(''); setNotice(''); try { await action(); await load(); onChanged(); setNotice('Cambios guardados en esta institución.'); } catch (failure) { setError(messageOf(failure)); } finally { setBusy(false); setConfirm(null); } };
  const [notice, setNotice] = useState('');
  const selectedProfile = detail?.profiles?.find(item => item.role === profile);
  const [draft, setDraft] = useState(emptyProfile());
  const [nextProfile, setNextProfile] = useState(null);
  const profileDirty = Boolean(selectedProfile && profileFields[profile].some(([field]) => String(draft[field] ?? '') !== String(selectedProfile[field] ?? '')));
  useEffect(() => { if (selectedProfile) setDraft({ ...emptyProfile(), ...selectedProfile, semester: selectedProfile.semester ?? '' }); }, [selectedProfile]);
  const roles = new Set(detail?.memberships?.map(item => item.role));
  return <Dialog title="Detalle institucional" size="profile" busy={busy} dirty={Boolean(roleToAdd && !roles.has(roleToAdd)) || profileDirty} onClose={onClose} footer={<Button data-dialog-close variant="secondary" onClick={onClose}>Cerrar</Button>}>
    {loading ? <LoadingState label="Cargando perfil institucional…" /> : error && !detail ? <ErrorState message={error} onRetry={load} /> : detail && <div className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}{notice && <Alert tone="success">{notice}</Alert>}
      <section className="tl-detail-summary"><h3 className="font-semibold">Cuenta global</h3><p className="text-sm text-slate-600">Solo lectura; no se modifica desde esta institución.</p><dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Nombre</dt><dd>{[detail.name, detail.lastNamePaterno, detail.lastNameMaterno].filter(Boolean).join(' ')}</dd></div><div><dt className="font-semibold">Correo principal</dt><dd className="break-all">{detail.email}</dd></div><div><dt className="font-semibold">Estado global</dt><dd><Badge tone={tone(detail.status)}>{statusLabel(detail.status)}</Badge></dd></div></dl></section>
      <div className="tl-profile-columns"><section className="tl-detail-section"><h3 className="font-semibold">Acceso y roles en esta institución</h3><div className="mt-2 space-y-2">{detail.memberships?.map(membership => <div key={membership.role} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><Badge tone={roleTone(membership.role)}>{membership.role}</Badge><div className="flex flex-wrap items-center gap-2"><Badge tone={tone(membership.status)}>{statusLabel(membership.status)}</Badge>{membership.status !== 'ACTIVE' && <Button variant="secondary" disabled={busy} onClick={() => setConfirm({ type: 'status', role: membership.role, status: 'ACTIVE' })}>Reactivar</Button>}{membership.status === 'ACTIVE' && <Button variant="secondary" disabled={busy} onClick={() => setConfirm({ type: 'status', role: membership.role, status: 'SUSPENDED' })}>Suspender</Button>}<Button variant="danger" disabled={busy || membership.status === 'REVOKED'} onClick={() => setConfirm({ type: 'revoke', role: membership.role })}>Revocar</Button></div></div>)}</div>
        {!roles.has('ESTUDIANTE') && ['DOCENTE', 'TUTOR'].some(role => !roles.has(role)) && <div className="mt-3 space-y-3"><select className="tl-input max-w-xs" aria-label="Rol para agregar" value={roleToAdd} onChange={event => { setRoleToAdd(event.target.value); setRoleDraft(emptyProfile()); }}><option value="">Agregar rol académico…</option>{institutionRoles.filter(role => role !== 'ESTUDIANTE' && !roles.has(role)).map(role => <option key={role}>{role}</option>)}</select>{roleToAdd && <><ProfileForm role={roleToAdd} value={roleDraft} onChange={setRoleDraft} prefix="add" /><Button disabled={!roleDraft.code || busy} onClick={() => mutate(() => institutionAdminApi.addRole(detail.userId, { role: roleToAdd, ...roleDraft, semester: roleDraft.semester === '' ? null : Number(roleDraft.semester) }))}>Agregar rol</Button></>}</div>}
      </section>
      <section className="tl-detail-section"><h3 className="font-semibold">Perfil institucional</h3>{nextProfile && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3"><p>Guarda tus cambios o descártalos antes de cambiar de perfil.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setNextProfile(null)}>Seguir editando</Button><Button variant="danger" onClick={() => { setProfile(nextProfile); setNextProfile(null); }}>Descartar y cambiar</Button></div></div>}<div className="mt-2 flex flex-wrap gap-2">{detail.profiles?.map(item => <Button key={item.role} disabled={busy} variant={profile === item.role ? 'primary' : 'secondary'} onClick={() => { if (profileDirty && profile !== item.role) setNextProfile(item.role); else setProfile(item.role); }}>{item.role}</Button>)}</div>{!selectedProfile && <p className="mt-4 text-sm text-slate-600">Selecciona un perfil para consultar y actualizar sus datos académicos.</p>}{selectedProfile && <form className="mt-4 space-y-4" onSubmit={event => { event.preventDefault(); mutate(() => institutionAdminApi.updateProfile(detail.userId, profile, { ...draft, semester: draft.semester === '' ? null : Number(draft.semester) })); }}><ProfileForm role={profile} value={draft} onChange={setDraft} prefix="edit" /><Button type="submit" busy={busy}>Guardar perfil local</Button></form>}</section></div>
      {confirm && <section className="rounded-lg border border-amber-300 bg-amber-50 p-3" role="alert"><p>{confirm.type === 'revoke' ? `Revocar ${confirm.role} conserva su historial y perfil, pero retira el acceso local.` : `${confirm.status === 'SUSPENDED' ? 'Suspender' : 'Reactivar'} la membresía ${confirm.role} solo afecta esta institución.`}</p><div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => setConfirm(null)}>Cancelar</Button><Button variant={confirm.type === 'revoke' ? 'danger' : 'primary'} busy={busy} onClick={() => mutate(() => confirm.type === 'revoke' ? institutionAdminApi.revokeRole(detail.userId, confirm.role) : institutionAdminApi.setMembershipStatus(detail.userId, confirm.role, confirm.status))}>Confirmar</Button></div></section>}
    </div>}
  </Dialog>;
}
UserDialog.propTypes = { userId: PropTypes.number.isRequired, onClose: PropTypes.func.isRequired, onChanged: PropTypes.func.isRequired };

export default function InstitutionUsersPage({ fixedRole = null }) {
  const [filters, setFilters] = useState({ q: '', role: fixedRole || '', membershipStatus: 'ALL', status: '' }); const [currentPage, setCurrentPage] = useState(0); const [result, setResult] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [selected, setSelected] = useState(null); const [importOpen, setImportOpen] = useState(false);
  const [academicFilters, setAcademicFilters] = useState(academicDefaults);
  const requestVersion = useRef(0);
  const title = fixedRole ? `Gestión de ${labels[fixedRole].toLowerCase()}` : 'Gestión de usuarios institucionales';
  const load = useCallback(async () => { const version = ++requestVersion.current; setLoading(true); setError(''); try { const data = await institutionAdminApi.usersWithProfiles({ ...filters, role: fixedRole || filters.role || undefined }); if (version === requestVersion.current) setResult(data); } catch (failure) { if (version === requestVersion.current) setError(messageOf(failure)); } finally { if (version === requestVersion.current) setLoading(false); } }, [filters, fixedRole]);
  useEffect(() => { load(); }, [load]);
  const setFilter = (key, value) => { setCurrentPage(0); setFilters(current => ({ ...current, [key]: value })); };
  const availableImportRole = fixedRole || filters.role;
  const profileRole = fixedRole || filters.role;
  const filterFields = profileRole === 'ESTUDIANTE' ? [['career', 'Carrera'], ['plan', 'Plan'], ['semester', 'Semestre']] : profileRole ? [['department', 'Departamento'], ['specialty', 'Especialidad']] : [['career', 'Carrera'], ['plan', 'Plan'], ['semester', 'Semestre'], ['department', 'Departamento'], ['specialty', 'Especialidad']];
  const filteredRows = (result?.items || []).filter(row => row.detail?.profiles?.some(profile => (!profileRole || profile.role === profileRole) && filterFields.every(([key]) => !academicFilters[key] || String(profile[key] ?? '') === academicFilters[key])) || filterFields.every(([key]) => !academicFilters[key]));
  const visibleRows = filteredRows.slice(currentPage * 10, (currentPage + 1) * 10);
  const clearFilters = () => { setCurrentPage(0); setFilters({ q: '', role: fixedRole || '', membershipStatus: 'ALL', status: '' }); setAcademicFilters(academicDefaults); };
  return <div className="space-y-6"><PageHeader title={title} description="Consulta y actualiza los perfiles académicos de tu institución." actions={<div className="flex flex-wrap items-center gap-2"><ExportActions title={title} fileBaseName={fixedRole?.toLowerCase() || 'usuarios-institucionales'} columns={exportColumns} rows={loading || error ? [] : filteredRows} />{availableImportRole && <Button variant="secondary" onClick={() => setImportOpen(true)}>Importar {labels[availableImportRole].toLowerCase()}</Button>}{availableImportRole ? <ExcelImportHelp section={labels[availableImportRole].toLowerCase()} /> : <ExcelImportHelp section="usuarios" />}</div>} />
    <Card className="tl-filter-bar"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field id="institution-users-search" label="Buscar">{props => <input {...props} className="tl-input" value={filters.q} onChange={event => setFilter('q', event.target.value)} placeholder="Nombre o correo" />}</Field>{!fixedRole && <Field id="institution-users-role" label="Rol">{props => <select {...props} className="tl-input" value={filters.role} onChange={event => setFilter('role', event.target.value)}><option value="">Todos los roles</option>{institutionRoles.map(role => <option key={role}>{role}</option>)}</select>}</Field>}<Field id="institution-users-status" label="Estado de cuenta">{props => <select {...props} className="tl-input" value={filters.status} onChange={event => setFilter('status', event.target.value)}><option value="">Todos</option>{['ACTIVE', 'CREATED_BY_ADMIN', 'DISABLED', 'BLOCKED'].map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>}</Field>{filterFields.map(([key, label]) => <Field key={key} id={`institution-users-${key}`} label={label}>{props => <select {...props} className="tl-input" value={academicFilters[key]} onChange={event => { setCurrentPage(0); setAcademicFilters(current => ({ ...current, [key]: event.target.value })); }}><option value="">Todos</option>{[...new Set((result?.items || []).flatMap(row => (row.detail?.profiles || []).filter(profile => !profileRole || profile.role === profileRole).map(profile => String(profile[key] ?? '')).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true })).map(value => <option key={value}>{value}</option>)}</select>}</Field>)}<div className="flex items-end"><Button variant="secondary" onClick={clearFilters}>Limpiar filtros</Button></div></div></Card>
    {loading && result && <p role="status" className="text-sm text-slate-600">Actualizando listado…</p>}
    {loading && !result ? <LoadingState label="Cargando usuarios institucionales…" /> : error && !result ? <ErrorState message={error} onRetry={load} /> : <Card className="p-0">{error && <Alert tone="error" className="m-4">{error}</Alert>}{!filteredRows.length ? <EmptyState title="No hay usuarios con estos filtros." description="Ajusta los filtros o crea una invitación desde el módulo correspondiente." /> : <Table label={title}><thead className="bg-slate-50"><tr><th scope="col">Persona</th><th scope="col">Correo principal</th><th scope="col">Roles institucionales</th>{filterFields.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}<th scope="col">Estado de cuenta</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{visibleRows.map(item => <tr className="border-t" key={item.userId}><td>{item.name}</td><td className="break-all">{item.email}</td><td className="space-x-1">{item.roles.map(role => <Badge key={role} tone={roleTone(role)}>{role}</Badge>)}</td>{filterFields.map(([key]) => <td key={key}>{item.detail?.profiles?.filter(profile => !profileRole || profile.role === profileRole).map(profile => profile[key]).filter(value => value !== null && value !== undefined && value !== '').join(', ') || '—'}</td>)}<td><Badge tone={tone(item.status)}>{statusLabel(item.status)}</Badge></td><td><IconButton icon="eye" label="Ver detalle" description={item.name} onClick={() => setSelected(item.userId)} /></td></tr>)}</tbody></Table>}<Pagination result={{ totalElements: filteredRows.length, totalPages: Math.ceil(filteredRows.length / 10), size: 10 }} page={currentPage} loading={loading} onPage={setCurrentPage} /></Card>}
    {selected && <UserDialog userId={selected} onClose={() => setSelected(null)} onChanged={load} />}{importOpen && <ImportDialog role={availableImportRole} onClose={() => setImportOpen(false)} onDone={load} />}
  </div>;
}
InstitutionUsersPage.propTypes = { fixedRole: PropTypes.oneOf([...institutionRoles, null]) };
