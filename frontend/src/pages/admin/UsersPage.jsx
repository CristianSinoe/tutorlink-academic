import InstitutionUsersPage from './InstitutionUsersPage';
import { useSearchParams } from 'react-router-dom';
import { Alert } from '../../components/ui/States';

export default function UsersPage() {
  const [search] = useSearchParams();
  return <>
    {search.get('legacy') === 'admins' && <Alert tone="info" className="mb-6">Los administradores institucionales se gestionan desde el panel SaaS. Esta vista solo administra perfiles y membresías académicas de la institución activa.</Alert>}
    <InstitutionUsersPage />
  </>;
}
