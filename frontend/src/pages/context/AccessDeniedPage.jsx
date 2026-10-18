import { Link } from 'react-router-dom';
export default function AccessDeniedPage() { return <main className="p-6 text-slate-900"><h1 className="text-2xl font-semibold">Acceso no disponible</h1><p className="my-4">Este espacio no está autorizado en tu contexto actual.</p><Link className="underline text-uvBlue" to="/context">Volver a tus espacios autorizados</Link></main>; }
