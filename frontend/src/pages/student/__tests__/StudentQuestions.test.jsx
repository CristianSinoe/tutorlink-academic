import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import StudentQuestions from "../StudentQuestions.jsx";
import { renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("StudentQuestions", () => {
  it("muestra estado vacío cuando no hay preguntas", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { content: [] },
    });

    renderWithProviders(
      <Routes>
        <Route path="/student/questions" element={<StudentQuestions />} />
      </Routes>,
      { route: "/student/questions" },
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no se encontraron preguntas con los filtros actuales/i),
      ).toBeInTheDocument();
    });
  });

  it("renderiza preguntas con estados visibles", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        content: [
          { id: 1, title: "Pendiente", status: "PENDIENTE", scope: "GENERAL", createdAt: "2025-01-01T10:00:00Z" },
          { id: 2, title: "Respondida", status: "PUBLICADA", scope: "PLAN", createdAt: "2025-01-02T10:00:00Z" },
          { id: 3, title: "Rechazada", status: "RECHAZADA", scope: "ACADEMICO", createdAt: "2025-01-03T10:00:00Z" },
        ],
      },
    });

    renderWithProviders(
      <Routes>
        <Route path="/student/questions" element={<StudentQuestions />} />
      </Routes>,
      { route: "/student/questions" },
    );

    await waitFor(() => {
      expect(screen.getByText("Pendiente")).toBeInTheDocument();
      expect(screen.getByText("Respondida")).toBeInTheDocument();
      expect(screen.getByText("Rechazada")).toBeInTheDocument();
    });
  });

  it("abre el detalle sin depender de backend real", async () => {
    const alertSpy = vi.spyOn(globalThis.window, "alert").mockImplementation(() => {});
    apiClient.get
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: 9,
              title: "Mi pregunta",
              status: "PUBLICADA",
              scope: "GENERAL",
              createdAt: "2025-01-03T10:00:00Z",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 9,
          title: "Mi pregunta",
          status: "PUBLICADA",
          scope: "GENERAL",
          createdAt: "2025-01-03T10:00:00Z",
          messages: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 9,
          title: "Mi pregunta",
          status: "PUBLICADA",
          scope: "GENERAL",
          createdAt: "2025-01-03T10:00:00Z",
          messages: [],
        },
      });

    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/student/questions" element={<StudentQuestions />} />
      </Routes>,
      { route: "/student/questions" },
    );

    await user.click(await screen.findByRole("button", { name: /ver detalle/i }));

    expect(
      await screen.findByRole("heading", {
        name: /conversación de mi pregunta/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/hilo de conversación/i)).toBeInTheDocument();
    expect(
      screen.getByText(/aún no hay mensajes registrados para esta pregunta/i),
    ).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenLastCalledWith("/api/questions/9/messages");
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
