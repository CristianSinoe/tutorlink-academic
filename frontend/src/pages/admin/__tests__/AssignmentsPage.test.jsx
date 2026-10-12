import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import AssignmentsPage from "../AssignmentsPage.jsx";
import { renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("AssignmentsPage", () => {
  it("muestra la ayuda e importa archivos Excel", async () => {
    apiClient.get.mockResolvedValue({ data: [] });
    apiClient.post.mockResolvedValue({ data: { total: 1, assigned: 1, errors: 0 } });
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/admin/assignments" element={<AssignmentsPage />} />
      </Routes>,
      { route: "/admin/assignments" },
    );

    await screen.findByText(/asignaciones tutor/i);
    await user.click(screen.getByRole("button", { name: /ayuda de asignaciones/i }));
    expect(screen.getByRole("dialog", { name: /ayuda de asignaciones/i })).toHaveTextContent("tutorCode");
    await user.click(screen.getByRole("button", { name: /cerrar ayuda/i }));
    await user.click(screen.getByRole("button", { name: /importar excel/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/importar asignaciones por excel/i),
      ).toBeInTheDocument();
    });
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
    expect(document.querySelector('input[type="file"]')).toHaveAttribute("accept", expect.stringContaining(".xlsx"));
    expect(screen.getAllByRole("button", { name: /importar excel/i })).toHaveLength(2);
    const file = new File(["archivo de prueba"], "asignaciones.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    await user.upload(document.querySelector('input[type="file"]'), file);
    await user.click(screen.getAllByRole("button", { name: /importar excel/i })[1]);
    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const [url, formData] = apiClient.post.mock.calls[0];
    expect(url).toBe("/api/admin/users/tutor-students/import-excel");
    expect(formData.get("file")).toBe(file);
    expect(await screen.findByText(/asignadas: 1/i)).toBeInTheDocument();
  });
});
