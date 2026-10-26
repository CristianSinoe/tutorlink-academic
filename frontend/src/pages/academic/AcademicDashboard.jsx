import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { academicApi, academicPage } from '../../api/academicApi';
import apiClient from '../../api/axiosClient';
import { combinedAcademic } from '../../context/sessionStore';
import TutorDashboard from '../tutor/TutorDashboard';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { ErrorState, LoadingState } from '../../components/ui/States';
import Button from '../../components/ui/Button';

export default function AcademicDashboard({ tutorOnly = false }) {
  const { auth } = useAuth();
  const teacher = auth.roles.includes('DOCENTE') && !tutorOnly;
  const tutor = auth.roles.includes('TUTOR');
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!teacher) return;
    let active = true;
    const reads = [academicApi.teacherCourses({ page: 0, size: 1 })];
    // Course-independent task/question totals use the server's authorized scope, never an institution ID.
    reads.push(apiClient.get('/api/teacher/tasks', { params: { page: 0, size: 1 } }).then(({ data }) => academicPage(data)));
    reads.push(apiClient.get('/api/teacher/questions', { params: { status: 'OPEN', page: 0, size: 1 } }).then(({ data }) => academicPage(data)));
    Promise.allSettled(reads).then(results => { if (active) setState({ retry, results }); });
    return () => { active = false; };
  }, [teacher, retry, auth.generation]);
  if (tutorOnly && combinedAcademic(auth)) return <Navigate to="/teacher" replace />;
  if (!teacher && tutorOnly) return <TutorDashboard />;
  const labels = ['Grupos asignados', 'Tareas disponibles', 'Consultas docentes abiertas'];
  return <div className="space-y-6">
    <PageHeader title={tutor ? 'Resumen de docencia y tutorías' : 'Resumen docente'} description={`Estás en tu espacio docente${tutor ? ' y de tutorías' : ''}. Información de ${auth.institutionName || 'la institución activa'}.`} actions={<Button variant="secondary" onClick={() => setRetry(value => value + 1)}>Actualizar resumen docente</Button>} />
    <section aria-label="Resumen docente" className="grid gap-4 md:grid-cols-3">{labels.map((label, index) => <Card key={label}><h2 className="font-semibold">{label}</h2>{state?.retry !== retry ? <LoadingState label="Consultando…" /> : state.results[index].status === 'fulfilled' ? <p className="my-3 text-3xl font-semibold text-uvBlue">{state.results[index].value.totalElements}</p> : <ErrorState message="Este dato no está disponible." onRetry={() => setRetry(value => value + 1)} />}</Card>)}</section>
    <Card><h2 className="font-semibold">Mis materias y actividades</h2><p className="my-3">Gestiona las tareas y materiales de tus grupos y consulta qué estudiantes han entregado. Los totales corresponden a registros que puedes consultar, incluidos tus borradores.</p><Link to="/teacher/courses" className="tl-button-primary">Ver mis materias</Link></Card>
    {tutor && <TutorDashboard embedded />}
  </div>;
}
AcademicDashboard.propTypes = { tutorOnly: PropTypes.bool };
