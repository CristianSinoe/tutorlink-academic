import PropTypes from 'prop-types';
import { isDeploymentPending } from '../config/runtimeConfig';

export default function DeploymentGate({ children }) {
  if (!isDeploymentPending()) return children;
  return <main className="grid min-h-dvh place-items-center bg-slate-50 p-6 text-slate-900">
    <section className="tl-card w-full max-w-lg space-y-5" aria-labelledby="deployment-title">
      <img src="/horizontal.svg" alt="TutorLink" className="h-16 max-w-full" />
      <h1 id="deployment-title" className="text-2xl font-semibold">Frontend disponible</h1>
      <p role="status">La conexión con los servicios de TutorLink está pendiente de configuración.</p>
      <p className="text-sm text-slate-600">El inicio de sesión estará disponible cuando se complete la conexión segura con el backend.</p>
    </section>
  </main>;
}
DeploymentGate.propTypes = { children: PropTypes.node };
