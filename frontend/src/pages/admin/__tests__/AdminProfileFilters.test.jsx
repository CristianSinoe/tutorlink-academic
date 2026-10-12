import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import StudentsPage from "../StudentsPage.jsx";
import TutorsPage from "../TutorsPage.jsx";
import UsersPage from "../UsersPage.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

const students = [
  { id: 1, name: "Ana", email: "ana@uv.mx", matricula: "S001", career: "ISC", semester: 2, assigned: true, status: "ACTIVE" },
  { id: 2, name: "Beto", email: "beto@uv.mx", matricula: "S002", career: "ISC", semester: 4, assigned: false, status: "ACTIVE" },
  { id: 3, name: "Caro", email: "caro@uv.mx", matricula: "S003", career: "Derecho", semester: 2, assigned: false, status: "ACTIVE" },
];

const tutors = [
  { id: 4, name: "Diana", email: "diana@uv.mx", tutorCode: "T001", department: "Sistemas", specialty: "Redes", hasAssignments: true, status: "ACTIVE" },
  { id: 5, name: "Elena", email: "elena@uv.mx", tutorCode: "T002", department: "Sistemas", specialty: "Frontend", hasAssignments: false, status: "ACTIVE" },
  { id: 6, name: "Fabián", email: "fabian@uv.mx", tutorCode: "T003", department: "Matemáticas", specialty: "Redes", hasAssignments: false, status: "ACTIVE" },
];

beforeEach(() => vi.clearAllMocks());

describe("filtros administrativos", () => {
  it("combina carrera, semestre y asignación en estudiantes", async () => {
    apiClient.get.mockResolvedValue({ data: students });
    const user = userEvent.setup();
    renderWithProviders(<StudentsPage />);
    await screen.findByText("ana@uv.mx");

    await user.selectOptions(screen.getByLabelText("Carrera"), "ISC");
    await user.selectOptions(screen.getByLabelText("Semestre"), "2");
    expect(screen.getByText("ana@uv.mx")).toBeInTheDocument();
    expect(screen.queryByText("beto@uv.mx")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Asignación"), "NO");
    expect(screen.queryByText("ana@uv.mx")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(screen.getByText("caro@uv.mx")).toBeInTheDocument();
  });

  it("combina departamento, especialidad y asignaciones en tutores", async () => {
    apiClient.get.mockResolvedValue({ data: tutors });
    const user = userEvent.setup();
    renderWithProviders(<TutorsPage />);
    await screen.findByText("diana@uv.mx");

    await user.selectOptions(screen.getByLabelText("Departamento"), "Sistemas");
    await user.selectOptions(screen.getByLabelText("Especialidad"), "Redes");
    await user.selectOptions(screen.getByLabelText("Asignaciones"), "YES");
    expect(screen.getByText("diana@uv.mx")).toBeInTheDocument();
    expect(screen.queryByText("elena@uv.mx")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Asignaciones"), "NO");
    expect(screen.queryByText("diana@uv.mx")).not.toBeInTheDocument();
  });

  it("cambia los filtros de perfil según el rol en usuarios y limpia los ocultos", async () => {
    apiClient.get.mockResolvedValue({
      data: [
        ...students.map((student) => ({ ...student, role: "ESTUDIANTE" })),
        ...tutors.map((tutor) => ({ ...tutor, role: "TUTOR" })),
      ],
    });
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);
    await screen.findByText("ana@uv.mx");

    await user.selectOptions(screen.getByLabelText("Rol"), "ESTUDIANTE");
    await user.selectOptions(screen.getByLabelText("Carrera"), "Derecho");
    expect(screen.getByText("caro@uv.mx")).toBeInTheDocument();
    expect(screen.queryByText("ana@uv.mx")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Rol"), "TUTOR");
    expect(screen.queryByLabelText("Carrera")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Departamento"), "Sistemas");
    await user.selectOptions(screen.getByLabelText("Asignaciones"), "NO");
    expect(screen.getByText("elena@uv.mx")).toBeInTheDocument();
    expect(screen.queryByText("diana@uv.mx")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Rol"), "ESTUDIANTE");
    expect(screen.getByLabelText("Carrera")).toHaveValue("ALL");
    expect(within(screen.getByRole("table")).getByText("ana@uv.mx")).toBeInTheDocument();
  });
});
