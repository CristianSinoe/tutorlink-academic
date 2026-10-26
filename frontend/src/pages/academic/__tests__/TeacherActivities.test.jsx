import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { renderWithProviders } from '../../../test/test-utils';
import TeacherActivities from '../../../components/academic/TeacherActivities';

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
const group = { id: 7, code: 'A', name: 'Grupo A', courseName: 'Matemáticas', periodName: 'Primavera' };
const response = content => ({ data: { content, page: 0, size: 5, totalElements: content.length, totalPages: content.length ? 1 : 0 } });
beforeEach(() => vi.resetAllMocks());

describe('Actividades del docente', () => {
  it('creates content, preserving its form after a recoverable conflict', async () => {
    apiClient.get.mockResolvedValue(response([]));
    apiClient.post.mockRejectedValueOnce({ response: { data: { message: 'Conflicto recuperable' } } }).mockResolvedValueOnce({ data: { id: 9 } });
    const user = userEvent.setup(); renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Clases y materiales' }));
    await user.click(screen.getByRole('button', { name: 'Crear clase o material' }));
    await user.type(screen.getByLabelText(/^Título/), 'Guía');
    await user.type(screen.getByLabelText('Contenido'), 'Leer el capítulo');
    await user.click(screen.getByRole('button', { name: 'Guardar actividad' }));
    expect(await screen.findByText('Conflicto recuperable')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Título/)).toHaveValue('Guía');
    await user.click(screen.getByRole('button', { name: 'Guardar actividad' }));
    expect(await screen.findByText('Actividad guardada.')).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenLastCalledWith('/api/teacher/contents', { groupId: 7, title: 'Guía', body: 'Leer el capítulo', published: false });
  });
  it('edits an owned task without changing its group and requires confirmation to discard', async () => {
    apiClient.get.mockResolvedValue(response([{ id: 3, title: 'Original', published: true, due_at: '2027-01-01T12:00:00Z', can_manage: true }]));
    apiClient.put.mockResolvedValue({}); const user = userEvent.setup();
    renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: 'Editar actividad' }));
    await user.clear(screen.getByLabelText(/^Título/)); await user.type(screen.getByLabelText(/^Título/), 'Editada');
    await user.click(screen.getByRole('button', { name: 'Cancelar edición' }));
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(screen.getByLabelText(/^Título/)).toHaveValue('Editada');
    await user.click(screen.getByRole('button', { name: 'Guardar actividad' }));
    await screen.findByText('Actividad guardada.');
    expect(apiClient.put).toHaveBeenCalledWith('/api/teacher/tasks/3', expect.objectContaining({ title: 'Editada', published: true }));
    expect(apiClient.put.mock.calls[0][1]).not.toHaveProperty('groupId');
  });
  it('confirms deletion and retains an activity whose historical references cause a conflict', async () => {
    apiClient.get.mockResolvedValue(response([{ id: 3, title: 'Histórica', published: true, can_manage: true }]));
    apiClient.delete.mockRejectedValue({ response: { data: { message: 'La actividad tiene entregas.' } } });
    renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar actividad' }));
    expect(apiClient.delete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }));
    expect(await screen.findByText('La actividad tiene entregas.')).toBeInTheDocument();
    expect(screen.getByText('La actividad tiene entregas.')).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Histórica' })).toBeInTheDocument();
  });
  it('does not offer editing for another author and opens final/pending student submissions', async () => {
    apiClient.get.mockImplementation(url => url.endsWith('/students') ? Promise.resolve(response([{ student_id: 1, matricula: 'S1', name: 'Ana', status: 'ON_TIME', submission_id: 5, body: 'Respuesta final' }, { student_id: 2, matricula: 'S2', name: 'Juan', status: 'PENDING' }])) : Promise.resolve(response([{ id: 3, title: 'Compartida', published: true, can_manage: false }])));
    renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Ver entregas' }));
    expect(screen.queryByRole('button', { name: 'Editar actividad' })).not.toBeInTheDocument();
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('A tiempo', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Pendiente', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Respuesta final')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/teacher/tasks/3/students', { params: { status: 'ALL', page: 0, size: 5 } });
  });
  it('loads authorized tasks and materials for the selected group with readable states', async () => {
    apiClient.get.mockResolvedValueOnce(response([{ id: 1, title: 'Ejercicio', instructions: 'Resolver problemas', published: false, allow_late_submissions: true }]))
      .mockResolvedValueOnce(response([{ id: 2, title: 'Lectura', body: 'Material autorizado', published: true }]));
    const user = userEvent.setup();
    renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    expect(await screen.findByText('Resolver problemas')).toBeInTheDocument();
    expect(screen.getByText('Borrador')).toBeInTheDocument();
    expect(screen.getByText('Permitidas')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/teacher/tasks', { params: { groupId: 7, page: 0, size: 5 } });
    await user.click(screen.getByRole('button', { name: 'Clases y materiales' }));
    expect(await screen.findByText('Material autorizado')).toBeInTheDocument();
    expect(screen.queryByText('Resolver problemas')).not.toBeInTheDocument();
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/teacher/contents', { params: { groupId: 7, page: 0, size: 5 } });
  });
  it('distinguishes access denial from an empty list and permits a safe read retry', async () => {
    apiClient.get.mockRejectedValueOnce({ response: { status: 403 } }).mockResolvedValueOnce(response([]));
    renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    expect(await screen.findByText('No tienes acceso a las actividades de este grupo.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText('Este grupo no tiene tareas disponibles.')).toBeInTheDocument();
  });
  it('discards delayed responses when changing the activity type', async () => {
    let resolveTasks;
    apiClient.get.mockImplementationOnce(() => new Promise(resolve => { resolveTasks = resolve; })).mockResolvedValueOnce(response([{ id: 2, title: 'Lectura nueva', published: true }]));
    renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clases y materiales' }));
    await screen.findByText('Lectura nueva');
    await act(async () => resolveTasks(response([{ id: 1, title: 'Tarea anterior', published: true }])));
    expect(screen.queryByText('Tarea anterior')).not.toBeInTheDocument();
    expect(screen.getByText('Lectura nueva')).toBeInTheDocument();
  });
  it('sends search and pagination to the real read contract', async () => {
    apiClient.get.mockResolvedValue({ data: { content: [{ id: 1, title: 'Tarea', published: true }], page: 0, size: 5, totalElements: 6, totalPages: 2 } });
    renderWithProviders(<TeacherActivities group={group} onClose={vi.fn()} />);
    await screen.findByText('Tarea');
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenLastCalledWith('/api/teacher/tasks', { params: { groupId: 7, page: 1, size: 5 } }));
  });
});
