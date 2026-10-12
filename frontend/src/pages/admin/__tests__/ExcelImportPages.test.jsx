import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, it, expect, vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import { renderWithProviders } from "../../../test/test-utils.jsx";
import StudentsPage from "../StudentsPage.jsx";
import TutorsPage from "../TutorsPage.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.get.mockResolvedValue({ data: [] });
  apiClient.post.mockResolvedValue({ data: { total: 1, created: 1, skippedExisting: 0 } });
});

it.each([
  ["estudiantes", StudentsPage, "/api/admin/users/students/import-excel"],
  ["tutores", TutorsPage, "/api/admin/users/tutors/import-excel"],
])("importa Excel de %s", async (section, Page, endpoint) => {
  const user = userEvent.setup();
  renderWithProviders(<Page />);

  await user.click(screen.getByRole("button", { name: `Ayuda de ${section}` }));
  expect(screen.getByRole("dialog", { name: `Ayuda de ${section}` })).toHaveTextContent(".xlsx");
  await user.click(screen.getByRole("button", { name: "Cerrar ayuda" }));
  await user.click(screen.getByRole("button", { name: "Importar Excel" }));

  const file = new File(["archivo de prueba"], `${section}.xlsx`, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  await user.upload(screen.getByLabelText(`Archivo Excel de ${section}`), file);
  await user.click(screen.getAllByRole("button", { name: "Importar Excel" })[1]);

  await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
  const [url, data] = apiClient.post.mock.calls[0];
  expect(url).toBe(endpoint);
  expect(data.get("file")).toBe(file);
  expect(await screen.findByText(/creados=1/i)).toBeInTheDocument();
});
