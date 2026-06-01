import { Route, Routes, useLocation } from "react-router-dom";
import { screen } from "@testing-library/react";
import AdminRoute from "../AdminRoute.jsx";
import ProtectedRoute from "../ProtectedRoute.jsx";
import { renderWithProviders } from "../../test/test-utils.jsx";

function LoginProbe() {
  const location = useLocation();
  return <div>{location.pathname + location.search}</div>;
}

describe("Route guards", () => {
  it("redirige a login si el usuario no está autenticado", async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/student/questions"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginProbe />} />
      </Routes>,
      { route: "/student/questions?tab=all" },
    );

    expect(await screen.findByText(/\/login\?next=/i)).toBeInTheDocument();
  });

  it("impide que un estudiante acceda al panel admin", async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <div>Admin panel</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      {
        route: "/admin/users",
        auth: {
          token: "jwt-student",
          role: "ESTUDIANTE",
          email: "student@uv.mx",
        },
      },
    );

    expect(await screen.findByText("Login screen")).toBeInTheDocument();
  });

  it("impide que un tutor acceda al panel admin", async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <div>Admin panel</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      {
        route: "/admin/users",
        auth: {
          token: "jwt-tutor",
          role: "TUTOR",
          email: "tutor@uv.mx",
        },
      },
    );

    expect(await screen.findByText("Login screen")).toBeInTheDocument();
  });

  it("permite acceso al panel admin cuando el rol es ADMIN", async () => {
    renderWithProviders(
      <Routes>
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <div>Admin panel</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>,
      {
        route: "/admin/users",
        auth: {
          token: "jwt-admin",
          role: "ADMIN",
          email: "admin@uv.mx",
        },
      },
    );

    expect(await screen.findByText("Admin panel")).toBeInTheDocument();
  });
});
