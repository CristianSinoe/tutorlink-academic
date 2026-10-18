import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { sessionHome } from '../../context/sessionStore';
export default function NotFoundPage() {
  const { auth } = useAuth();
  return <main className="p-6 text-slate-900"><h1 className="text-2xl font-semibold">Página no encontrada</h1>
    <p className="my-4">La dirección no corresponde a una pantalla disponible.</p>
    <Link className="underline text-uvBlue" to={auth.token ? sessionHome(auth) : '/login'}>Volver al inicio</Link></main>;
}
