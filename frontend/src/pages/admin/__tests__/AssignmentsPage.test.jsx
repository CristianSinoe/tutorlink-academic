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
  it("renderiza el acceso para importar CSV y muestra el modal", async () => {
    apiClient.get.mockResolvedValueOnce({ data: [] });
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/admin/assignments" element={<AssignmentsPage />} />
      </Routes>,
      { route: "/admin/assignments" },
    );

    await screen.findByText(/asignaciones tutor/i);
    await user.click(screen.getByRole("button", { name: /importar csv/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/importar asignaciones por csv/i),
      ).toBeInTheDocument();
    });
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
    expect(screen.getAllByRole("button", { name: /importar csv/i })).toHaveLength(2);
  });
});
