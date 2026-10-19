import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { institutionAdminApi } from '../../api/institutionAdminApi';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { Alert, ErrorState, LoadingState } from '../../components/ui/States';
import { useAuth } from '../../context/useAuth';

const messageOf = error => error?.response?.data?.message || error?.response?.data?.error || 'No pudimos cargar el resumen institucional.';
const spaces = [
  { role: undefined, title: 'Usuarios institucionales', to: '/admin/users', description: 'Personas con al menos un acceso institucional activo.' },
  { role: 'ESTUDIANTE', title: 'Estudiantes', to: '/admin/students', description: 'Perfiles de estudiante con acceso institucional activo.' },
  { role: 'DOCENTE', title: 'Docentes', to: '/admin/teachers', description: 'Perfiles docentes con acceso institucional activo.' },
  { role: 'TUTOR', title: 'Tutores académicos', to: '/admin/tutors', description: 'Perfiles de tutoría con acceso institucional activo.' },
];

export default function AdminDashboard() {
  const { auth } = useAuth(); const [counts, setCounts] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const values = await Promise.all(spaces.map(space => institutionAdminApi.users({ role: space.role, membershipStatus: 'ACTIVE', page: 0, size: 1 }))); setCounts(values.map(value => value.total)); } catch (failure) { setError(messageOf(failure)); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return <div className="space-y-6"><PageHeader title="Panel de administración" description={`Administra perfiles y membresías de ${auth.institutionName || 'la institución activa'}. Las cuentas globales permanecen protegidas.`} actions={<Button busy={loading} onClick={load}>Actualizar</Button>} />
    {error && <Alert tone="error">{error}</Alert>}{loading && !counts ? <LoadingState label="Cargando resumen institucional…" /> : error && !counts ? <ErrorState message={error} onRetry={load} /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{spaces.map((space, index) => <Card key={space.title}><p className="text-sm font-semibold text-slate-700">{space.title}</p><p className="tl-dashboard-count mt-2 text-3xl font-semibold text-uvBlue">{counts?.[index] ?? '—'}</p><p className="mt-2 text-xs text-slate-600">{space.description}</p><Link className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-uvBlue underline" to={space.to}>Abrir módulo</Link></Card>)}</section>}
    <Card><h2 className="text-lg font-semibold">Operaciones institucionales</h2><p className="mt-2 text-sm text-slate-600">Crea invitaciones verificadas para nuevas vinculaciones, consulta su estado y usa importaciones para procesar registros por fila. La entrega de correo no se confirma desde este panel.</p><div className="mt-4 flex flex-wrap gap-3"><Link className="tl-button-primary" to="/admin/invitations">Gestionar invitaciones</Link><Link className="tl-button-secondary" to="/admin/assignments">Asignaciones tutor–estudiante</Link></div></Card>
  </div>;
}
