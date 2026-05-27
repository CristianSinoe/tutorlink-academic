import { Route, Routes } from "react-router-dom";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import UsersPage from "../UsersPage.jsx";
import { renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const usersFixture = [
  {
    id: 1,
    name: "Admin",
    lastNamePaterno: "QA",
    lastNameMaterno: "",
    email: "admin@uv.mx",
    role: "ADMIN",
    status: "ACTIVE",
  },
  {
    id: 2,
    name: "Tutor",
    lastNamePaterno: "Uno",
    lastNameMaterno: "",
    email: "tutor@uv.mx",
    role: "TUTOR",
    status: "ACTIVE",
  },
  {
    id: 3,
    name: "Estudiante",
    lastNamePaterno: "Dos",
    lastNameMaterno: "",
    email: "student@uv.mx",
    role: "ESTUDIANTE",
    status: "DISABLED",
  },
];

describe("UsersPage", () => {
  beforeEach(() => {
    apiClient.get.mockResolvedValue({ data: usersFixture });
  });

  it("renderiza la lista de usuarios mockeada", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/users" element={<UsersPage />} />
      </Routes>,
      {
        route: "/admin/users",
        auth: {
          token: "jwt-admin",
          role: "ADMIN",
          email: "admin@uv.mx",
          name: "Admin QA",
        },
      },
    );

    await screen.findByText(/gestión de usuarios/i);
    expect(screen.getByText("tutor@uv.mx")).toBeInTheDocument();
    expect(screen.getByText("student@uv.mx")).toBeInTheDocument();
  });

  it("filtra usuarios por búsqueda y estado", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/admin/users" element={<UsersPage />} />
      </Routes>,
      {
        route: "/admin/users",
        auth: {
          token: "jwt-admin",
          role: "ADMIN",
          email: "admin@uv.mx",
          name: "Admin QA",
        },
      },
    );

    await screen.findByText("tutor@uv.mx");
    await user.type(
      screen.getByPlaceholderText(/nombre, correo o rol/i),
      "student",
    );

    expect(screen.getByText("student@uv.mx")).toBeInTheDocument();
    expect(screen.queryByText("tutor@uv.mx")).not.toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[1], "DISABLED");
    expect(screen.getByText("student@uv.mx")).toBeInTheDocument();
  });

  it("bloquea visualmente el cambio de estado del propio admin", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin/users" element={<UsersPage />} />
      </Routes>,
      {
        route: "/admin/users",
        auth: {
          token: "jwt-admin",
          role: "ADMIN",
          email: "admin@uv.mx",
          name: "Admin QA",
        },
      },
    );

    await screen.findByText("admin@uv.mx");
    const adminRow = screen.getByText("admin@uv.mx").closest("tr");
    expect(adminRow).not.toBeNull();
    expect(within(adminRow).getByText(/cambiar estado/i)).toBeInTheDocument();
    expect(
      within(adminRow).queryByRole("button", { name: /^cambiar estado$/i }),
    ).not.toBeInTheDocument();
  });

  it("abre modal y actualiza el estado de un usuario válido", async () => {
    apiClient.patch.mockResolvedValueOnce({ data: {} });
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/admin/users" element={<UsersPage />} />
      </Routes>,
      {
        route: "/admin/users",
        auth: {
          token: "jwt-admin",
          role: "ADMIN",
          email: "admin@uv.mx",
          name: "Admin QA",
        },
      },
    );

    await screen.findByText("tutor@uv.mx");
    const actionButtons = screen.getAllByRole("button", { name: /^cambiar estado$/i });
    await user.click(actionButtons[0]);

    await screen.findByText(/cambiar estado de usuario/i);
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[selects.length - 1], "DISABLED");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith("/api/admin/users/2/status", {
        role: "TUTOR",
        status: "DISABLED",
      });
    });
  });
});
