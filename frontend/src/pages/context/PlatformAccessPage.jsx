import { useAuth } from '../../context/useAuth';
import InstitutionSwitch from '../../components/context/InstitutionSwitch';
export default function PlatformAccessPage() {
  const { auth } = useAuth();
  return <section className="mx-auto max-w-4xl px-4 py-8 text-slate-900">
    <h1 className="text-2xl font-semibold text-uvBlue">Acceso de plataforma</h1>
    <p className="my-4">Consulta instituciones activas y entra a su contexto autorizado. La administración SaaS completa pertenece a un incremento posterior.</p>
    {auth.optionsLoading ? <p role="status">Cargando instituciones…</p> : auth.platformInstitutions.length === 0 ? <p role="status">No hay instituciones cargadas. Usa el control de actualización si hubo un error.</p>
      : <ul className="space-y-4">{auth.platformInstitutions.map(option => <li key={option.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white p-4">
        <h2 className="text-lg font-semibold">{option.name}</h2>{option.status === 'ACTIVE' ? <InstitutionSwitch target={{ institutionId: option.id, name: option.name }} /> : <p>Institución inactiva: no permite acceso contextual.</p>}
      </li>)}</ul>}
  </section>;
}
