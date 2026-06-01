import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import StudentNewQuestion from "../StudentNewQuestion.jsx";
import { renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("StudentNewQuestion", () => {
  it("renderiza el formulario principal", () => {
    renderWithProviders(
      <Routes>
        <Route path="/student/ask" element={<StudentNewQuestion />} />
      </Routes>,
      { route: "/student/ask" },
    );

    expect(
      screen.getByPlaceholderText(/¿cómo agendo una tutoría/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/explica tu situación o duda/i),
    ).toBeInTheDocument();
  });

  it("bloquea el envío cuando faltan campos obligatorios", async () => {
    const alertSpy = vi.spyOn(globalThis.window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/student/ask" element={<StudentNewQuestion />} />
      </Routes>,
      { route: "/student/ask" },
    );

    await user.click(screen.getByRole("button", { name: /enviar pregunta/i }));

    expect(alertSpy).toHaveBeenCalledWith(
      "El título y la descripción son obligatorios.",
    );
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("envía la pregunta con payload válido", async () => {
    const alertSpy = vi.spyOn(globalThis.window, "alert").mockImplementation(() => {});
    apiClient.post.mockResolvedValueOnce({
      data: { id: 77 },
    });

    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/student/ask" element={<StudentNewQuestion />} />
        <Route path="/student/questions" element={<div>Questions page</div>} />
      </Routes>,
      { route: "/student/ask" },
    );

    await user.type(
      screen.getByPlaceholderText(/¿cómo agendo una tutoría/i),
      "Necesito apoyo",
    );
    await user.selectOptions(screen.getByRole("combobox"), "ACADEMICO");
    await user.type(
      screen.getByPlaceholderText(/explica tu situación o duda/i),
      "Quiero saber cómo se asigna un tutor.",
    );
    await user.click(screen.getByRole("button", { name: /enviar pregunta/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/api/student/questions", {
        scope: "ACADEMICO",
        title: "Necesito apoyo",
        body: "Quiero saber cómo se asigna un tutor.",
        recaptchaToken: "prueba-login",
      });
    });
    expect(alertSpy).toHaveBeenCalledWith("Pregunta enviada correctamente.");
  });
});
