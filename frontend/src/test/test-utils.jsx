import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../context/auth-context.js";

const defaultAuth = {
  token: null,
  role: null,
  roles: [],
  institutionId: null,
  selectedRole: null,
  generation: 0,
  switching: false,
  options: [],
  platformOptions: [],
  platformInstitutions: [],
  email: null,
  name: null,
  loading: false,
};

export function seedStoredAuth(auth) {
  if (!auth) {
    globalThis.window.localStorage.removeItem("auth");
    return;
  }

  globalThis.window.localStorage.setItem(
    "auth",
    JSON.stringify({
      version: 2,
      roles: auth.roles ?? [],
      institutionId: auth.institutionId ?? null,
      selectedRole: auth.selectedRole ?? null,
      token: auth.token ?? null,
      role: auth.role ?? null,
      email: auth.email ?? null,
      name: auth.name ?? null,
    }),
  );
}

export function buildAuthValue(authOverrides = {}, overrides = {}) {
  const auth = { ...defaultAuth, ...authOverrides };
  // Migrate explicit legacy test fixtures; production never derives permissions from role.
  if (auth.token && authOverrides.roles === undefined) {
    auth.roles = auth.role ? [auth.role] : [];
    auth.institutionId = 1;
    auth.selectedRole = auth.role;
  }

  return {
    auth,
    login: vi.fn(),
    logout: vi.fn(),
    selectRole: vi.fn(),
    refreshOptions: vi.fn().mockResolvedValue([]),
    switchInstitution: vi.fn(),
    retryRestore: vi.fn().mockResolvedValue(),
    ...overrides,
  };
}

export function renderWithProviders(
  ui,
  {
    route = "/",
    initialEntries,
    auth = {},
    authValue,
  } = {},
) {
  const value = authValue ?? buildAuthValue(auth);

  if (value?.auth) {
    seedStoredAuth(value.auth);
  }

  const entries = initialEntries ?? [route];

  return {
    authValue: value,
    ...render(
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>
      </AuthContext.Provider>,
    ),
  };
}
