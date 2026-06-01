import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import TutorPendingPage from "../TutorPendingPage.jsx";
import { renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("TutorPendingPage", () => {
  it("muestra estado vacío cuando no hay pendientes", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [] });

    renderWithProviders(
      <Routes>
        <Route path="/tutor/pending" element={<TutorPendingPage />} />
      </Routes>,
      { route: "/tutor/pending" },
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no tienes preguntas pendientes por el momento/i),
      ).toBeInTheDocument();
    });
  });

  it("abre el detalle de una pregunta pendiente", async () => {
    apiClient.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: "Duda de materia",
            scope: "GENERAL",
            createdAt: "2025-01-01T10:00:00Z",
            studentName: "Ana",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 1,
          title: "Duda de materia",
          scope: "GENERAL",
          status: "PENDIENTE",
          createdAt: "2025-01-01T10:00:00Z",
          studentName: "Ana",
          messages: [],
          canReply: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 1,
          title: "Duda de materia",
          scope: "GENERAL",
          status: "PENDIENTE",
          createdAt: "2025-01-01T10:00:00Z",
          studentName: "Ana",
          messages: [],
          canReply: true,
        },
      });

    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/tutor/pending" element={<TutorPendingPage />} />
      </Routes>,
      { route: "/tutor/pending" },
    );

    await user.click(
      await screen.findByRole("button", { name: /ver detalle \/ responder/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/conversación de la pregunta/i)).toBeInTheDocument();
    });
  });

  it("bloquea respuesta vacía del tutor", async () => {
    const alertSpy = vi.spyOn(globalThis.window, "alert").mockImplementation(() => {});
    apiClient.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: "Duda de materia",
            scope: "GENERAL",
            createdAt: "2025-01-01T10:00:00Z",
            studentName: "Ana",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 1,
          title: "Duda de materia",
          scope: "GENERAL",
          status: "PENDIENTE",
          createdAt: "2025-01-01T10:00:00Z",
          studentName: "Ana",
          messages: [],
          canReply: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 1,
          title: "Duda de materia",
          scope: "GENERAL",
          status: "PENDIENTE",
          createdAt: "2025-01-01T10:00:00Z",
          studentName: "Ana",
          messages: [],
          canReply: true,
        },
      });

    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/tutor/pending" element={<TutorPendingPage />} />
      </Routes>,
      { route: "/tutor/pending" },
    );

    await user.click(
      await screen.findByRole("button", { name: /ver detalle \/ responder/i }),
    );
    await user.click(screen.getByRole("button", { name: /aplicar acción/i }));

    expect(alertSpy).toHaveBeenCalledWith("Escribe la respuesta para el estudiante.");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("envía una respuesta válida del tutor", async () => {
    apiClient.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: "Duda de materia",
            scope: "GENERAL",
            createdAt: "2025-01-01T10:00:00Z",
            studentName: "Ana",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 1,
          title: "Duda de materia",
          scope: "GENERAL",
          status: "PENDIENTE",
          createdAt: "2025-01-01T10:00:00Z",
          studentName: "Ana",
          messages: [],
          canReply: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 1,
          title: "Duda de materia",
          scope: "GENERAL",
          status: "PENDIENTE",
          createdAt: "2025-01-01T10:00:00Z",
          studentName: "Ana",
          messages: [],
          canReply: true,
        },
      })
      .mockResolvedValueOnce({
        data: {
          questionId: 1,
          title: "Duda de materia",
          scope: "GENERAL",
          status: "PUBLICADA",
          createdAt: "2025-01-01T10:00:00Z",
          studentName: "Ana",
          messages: [],
          canReply: true,
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: "Duda de materia",
            scope: "GENERAL",
            createdAt: "2025-01-01T10:00:00Z",
            studentName: "Ana",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: "Duda de materia",
            scope: "GENERAL",
            createdAt: "2025-01-01T10:00:00Z",
            studentName: "Ana",
          },
        ],
      });
    apiClient.post.mockResolvedValueOnce({ data: {} });

    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/tutor/pending" element={<TutorPendingPage />} />
      </Routes>,
      { route: "/tutor/pending" },
    );

    await user.click(
      await screen.findByRole("button", { name: /ver detalle \/ responder/i }),
    );
    await user.type(
      screen.getByPlaceholderText(/escribe aquí tu respuesta para el estudiante/i),
      "Puedes revisar tu plan de estudios con coordinación.",
    );
    await user.click(screen.getByRole("button", { name: /aplicar acción/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/tutor/questions/1/answer", {
        body: "Puedes revisar tu plan de estudios con coordinación.",
      });
    });
  });
});
