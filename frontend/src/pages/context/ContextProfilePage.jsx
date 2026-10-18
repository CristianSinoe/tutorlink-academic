import ProfileContextSection from '../../components/context/ProfileContextSection';
import { useAuth } from '../../context/useAuth';
export default function ContextProfilePage() {
  const { auth } = useAuth();
  return <div className="mx-auto max-w-4xl space-y-6">
    <h1 className="text-2xl font-semibold text-uvBlue">Mi perfil</h1>
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-semibold">Datos de sesión</h2>
      <dl className="space-y-3"><div><dt className="text-sm font-semibold">Nombre</dt><dd className="break-words">{auth.name}</dd></div><div><dt className="text-sm font-semibold">Correo principal</dt><dd className="break-all">{auth.email}</dd></div></dl>
      <p className="mt-4 text-sm text-slate-600">Estos datos identifican tu sesión. La edición del perfil personal no está disponible en este espacio.</p>
    </section>
    <ProfileContextSection />
  </div>;
}
