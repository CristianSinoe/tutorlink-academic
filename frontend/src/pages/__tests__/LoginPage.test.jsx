import { Route, Routes, useLocation } from "react-router-dom";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import apiClient from "../../api/axiosClient";
import LoginPage from "../LoginPage.jsx";
import { renderWithProviders } from "../../test/test-utils.jsx";

vi.mock("../../api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("react-google-recaptcha", () => ({
  default: function MockRecaptcha({ onChange }) {
    return (
      <button type="button" onClick={() => onChange("test-recaptcha-token")}>
        Resolver reCAPTCHA
      </button>
    );
  },
}));

function OtpLocationProbe() {
  const location = useLocation();
  return (
    <div>
      <span>OTP Screen</span>
      <span>{location.state?.email}</span>
    </div>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    import.meta.env.VITE_RECAPTCHA_SITE_KEY = "test-site-key";
  });

  async function renderLogin() {
    vi.useFakeTimers();

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpLocationProbe />} />
      </Routes>,
      { route: "/login" },
    );

    await act(async () => {
      vi.advanceTimersByTime(5600);
    });

    vi.useRealTimers();

    const user = userEvent.setup();
    return user;
  }

  it("renderiza los campos principales del formulario", async () => {
    await renderLogin();

    expect(
      screen.getByLabelText(/correo institucional/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ingresar/i }),
    ).toBeInTheDocument();
  });

  it("muestra error si no se resuelve el reCAPTCHA", async () => {
    const user = await renderLogin();

    await user.type(screen.getByLabelText(/correo institucional/i), "qa@uv.mx");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /debes confirmar que no eres un robot/i,
    );
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("navega a OTP cuando el login requiere verificación adicional", async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        requiresOtp: true,
        otpToken: "otp-123",
        message: "Código enviado",
        resendCooldownSeconds: 45,
      },
    });

    const user = await renderLogin();

    await user.type(screen.getByLabelText(/correo institucional/i), "qa@uv.mx");
    await user.type(screen.getByLabelText(/^contraseña$/i), "secret123");
    await user.click(screen.getByRole("button", { name: /resolver recaptcha/i }));
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await screen.findByText("OTP Screen");
    expect(screen.getByText("qa@uv.mx")).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login", {
      email: "qa@uv.mx",
      password: "secret123",
      recaptchaToken: "test-recaptcha-token",
    });
  });

  it("muestra mensaje de error visible si el backend rechaza el login", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    apiClient.post.mockRejectedValueOnce({
      response: {
        data: {
          message: "Credenciales inválidas.",
        },
      },
    });

    const user = await renderLogin();

    await user.type(screen.getByLabelText(/correo institucional/i), "qa@uv.mx");
    await user.type(screen.getByLabelText(/^contraseña$/i), "bad-pass");
    await user.click(screen.getByRole("button", { name: /resolver recaptcha/i }));
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /credenciales inválidas/i,
      );
    });
  });
});
