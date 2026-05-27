import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../context/auth-context.js";

const defaultAuth = {
  token: null,
  role: null,
  email: null,
  name: null,
  loading: false,
};

export function seedStoredAuth(auth) {
  if (!auth) {
    window.localStorage.removeItem("auth");
    return;
  }

  window.localStorage.setItem(
    "auth",
    JSON.stringify({
      token: auth.token ?? null,
      role: auth.role ?? null,
      email: auth.email ?? null,
      name: auth.name ?? null,
    }),
  );
}

export function buildAuthValue(authOverrides = {}, overrides = {}) {
  const auth = { ...defaultAuth, ...authOverrides };

  return {
    auth,
    login: vi.fn(),
    logout: vi.fn(),
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
