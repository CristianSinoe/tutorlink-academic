import { Route, Routes } from "react-router-dom";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import apiClient from "../../../api/axiosClient";
import OtpPage from "../OtpPage.jsx";
import { buildAuthValue, renderWithProviders } from "../../../test/test-utils.jsx";

vi.mock("../../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function StudentLanding() {
  return <div>Student Home</div>;
}

function LoginLanding() {
  return <div>Login Home</div>;
}

describe("OtpPage", () => {
  function renderOtpPage({ state } = {}) {
    const authValue = buildAuthValue();

    const initialEntries = [
      state
        ? { pathname: "/otp", state }
        : { pathname: "/otp" },
    ];

    const view = renderWithProviders(
      <Routes>
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/student" element={<StudentLanding />} />
        <Route path="/login" element={<LoginLanding />} />
      </Routes>,
      { initialEntries, authValue },
    );

    return { ...view, authValue };
  }

  it("renderiza el formulario OTP con datos de navegación", () => {
    renderOtpPage({
      state: {
        otpToken: "otp-123",
        email: "qa@uv.mx",
        message: "Código enviado",
        resendCooldownSeconds: 5,
      },
    });

    expect(
      screen.getByRole("heading", { name: /verificación en dos pasos/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("qa@uv.mx")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/código de verificación de 6 dígitos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirmar código/i }),
    ).toBeInTheDocument();
  });

  it("redirige a login si no recibe otpToken en el estado", async () => {
    renderOtpPage();

    await waitFor(() => {
      expect(screen.getByText("Login Home")).toBeInTheDocument();
    });
  });

  it("verifica OTP y navega según el rol", async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        token: "jwt-123",
        role: "ESTUDIANTE",
        email: "qa@uv.mx",
        name: "QA User",
      },
    });

    const user = userEvent.setup();
    const { authValue } = renderOtpPage({
      state: {
        otpToken: "otp-123",
        email: "qa@uv.mx",
      },
    });

    await user.type(
      screen.getByLabelText(/código de verificación de 6 dígitos/i),
      "123456",
    );
    await user.click(screen.getByRole("button", { name: /confirmar código/i }));

    await screen.findByText("Student Home");
    expect(authValue.login).toHaveBeenCalledWith({
      token: "jwt-123",
      role: "ESTUDIANTE",
      email: "qa@uv.mx",
      name: "QA User",
    });
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login/verify-otp", {
      otpToken: "otp-123",
      code: "123456",
    });
  });

  it("muestra error cuando el OTP es inválido", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Código inválido o expirado.",
        },
      },
    });

    const user = userEvent.setup();
    renderOtpPage({
      state: {
        otpToken: "otp-123",
        email: "qa@uv.mx",
      },
    });

    await user.type(
      screen.getByLabelText(/código de verificación de 6 dígitos/i),
      "999999",
    );
    await user.click(screen.getByRole("button", { name: /confirmar código/i }));

    await waitFor(() => {
      expect(screen.getByText(/código inválido o expirado/i)).toBeInTheDocument();
    });
  });

  it("permite reenviar el código cuando termina el cooldown", async () => {
    vi.useFakeTimers();
    apiClient.post.mockResolvedValueOnce({
      data: {
        otpToken: "otp-renovado",
        message: "Se envió un nuevo código.",
        resendCooldownSeconds: 10,
      },
    });

    renderOtpPage({
      state: {
        otpToken: "otp-123",
        email: "qa@uv.mx",
        resendCooldownSeconds: 1,
      },
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    vi.useRealTimers();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /reenviar código$/i }));

    await waitFor(() => {
      expect(screen.getByText(/se envió un nuevo código/i)).toBeInTheDocument();
    });
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login/resend-otp", {
      otpToken: "otp-123",
    });
  });
});
