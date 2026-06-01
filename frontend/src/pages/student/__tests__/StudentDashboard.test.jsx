import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import StudentDashboard from "../StudentDashboard.jsx";
import { renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("StudentDashboard", () => {
  it("renderiza accesos y métricas del estudiante con datos mockeados", async () => {
    apiClient.get
      .mockResolvedValueOnce({
        data: { id: 1, role: "ESTUDIANTE", email: "student@uv.mx" },
      })
      .mockResolvedValueOnce({
        data: {
          content: [
            { id: 1, title: "Pregunta 1", status: "PENDIENTE", createdAt: "2025-01-01T10:00:00Z" },
            { id: 2, title: "Pregunta 2", status: "PUBLICADA", createdAt: "2025-01-02T10:00:00Z" },
          ],
        },
      });

    renderWithProviders(
      <Routes>
        <Route path="/student" element={<StudentDashboard />} />
      </Routes>,
      {
        route: "/student",
        auth: {
          token: "jwt-student",
          role: "ESTUDIANTE",
          email: "student@uv.mx",
          name: "Student QA",
        },
      },
    );

    expect(screen.getByText(/dashboard del estudiante/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hacer nueva pregunta/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ver mis preguntas/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/preguntas enviadas/i)).toBeInTheDocument();
      expect(screen.getByText(/preguntas respondidas/i)).toBeInTheDocument();
      expect(screen.getByText(/preguntas pendientes/i)).toBeInTheDocument();
      expect(screen.getByText("Pregunta 2")).toBeInTheDocument();
    });
  });
});
