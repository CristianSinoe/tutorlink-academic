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
        roles: ["ESTUDIANTE"],
        institutionId: 1,
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
        roles: ["ESTUDIANTE"],
        institutionId: 1,
      email: "qa@uv.mx",
      name: "QA User",
    }, []);
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

const institutions = [{ institutionId: 1, name: 'Escuela A', roles: ['DOCENTE', 'TUTOR'] }, { institutionId: 2, name: 'Escuela B', roles: ['ESTUDIANTE'] }];
function contextualOtp(state) {
  return renderWithProviders(<Routes><Route path="/otp" element={<OtpPage />} /><Route path="/teacher" element={<div>Docencia y tutorías</div>} /><Route path="/context" element={<p>Elegir espacio</p>} /><Route path="/student" element={<p>Estudiante</p>} /><Route path="/platform" element={<p>Plataforma</p>} /></Routes>,
    { initialEntries: [{ pathname: '/otp', state: { otpToken: 'otp-context', email: 'persona@personal.test', institutions, ...state } }] });
}
it('exige elegir entre instituciones antes de consumir OTP', async () => {
  contextualOtp(); const user = userEvent.setup();
  await user.type(screen.getByLabelText(/código de verificación de 6 dígitos/i), '123456');
  await user.click(screen.getByRole('button', { name: /confirmar código/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/selecciona una institución/i);
  expect(apiClient.post).not.toHaveBeenCalled();
});
it('envía la institución elegida y conserva todos los roles del contrato', async () => {
  const data = { token: 'jwt', role: 'TUTOR', roles: ['DOCENTE', 'TUTOR'], institutionId: 1, email: 'persona@personal.test', name: 'Persona' };
  apiClient.post.mockResolvedValueOnce({ data });
  const { authValue } = contextualOtp(); const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Institución de acceso'), '1');
  await user.type(screen.getByLabelText(/código de verificación de 6 dígitos/i), '123456'); await user.click(screen.getByRole('button', { name: /confirmar código/i }));
  expect(await screen.findByText('Docencia y tutorías')).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login/verify-otp', { otpToken: 'otp-context', code: '123456', institutionId: 1 });
  expect(authValue.login).toHaveBeenCalledWith(data, institutions);
});
it('una única institución ya está seleccionada y un rol dirige a su espacio', async () => {
  apiClient.post.mockResolvedValueOnce({ data: { token: 'jwt', role: 'ESTUDIANTE', roles: ['ESTUDIANTE'], institutionId: 2, email: 'p@example.test', name: 'Persona' } });
  contextualOtp({ institutions: [institutions[1]] }); const user = userEvent.setup();
  expect(screen.getByLabelText('Institución de acceso')).toHaveValue('2');
  await user.type(screen.getByLabelText(/código de verificación de 6 dígitos/i), '123456'); await user.click(screen.getByRole('button', { name: /confirmar código/i }));
  expect(await screen.findByText('Estudiante')).toBeInTheDocument();
});
it('acceso de plataforma omite institución y exige respuesta global autorizada', async () => {
  apiClient.post.mockResolvedValueOnce({ data: { token: 'jwt', role: 'SUPER_ADMIN', roles: ['PLATFORM_SUPER_ADMIN'], institutionId: null, email: 'p@example.test', name: 'Persona' } });
  contextualOtp({ platformAccess: true }); const user = userEvent.setup();
  expect(screen.queryByLabelText('Institución de acceso')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText(/código de verificación de 6 dígitos/i), '123456'); await user.click(screen.getByRole('button', { name: /confirmar código/i }));
  expect(await screen.findByText('Plataforma')).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login/verify-otp', { otpToken: 'otp-context', code: '123456' });
});
it('rechaza respuesta contextual ajena antes de persistirla', async () => {
  apiClient.post.mockResolvedValueOnce({ data: { token: 'jwt', role: 'ESTUDIANTE', roles: ['ESTUDIANTE'], institutionId: 2, email: 'p@example.test', name: 'Persona' } });
  const { authValue } = contextualOtp({ institutions: [institutions[0]] }); const user = userEvent.setup();
  await user.type(screen.getByLabelText(/código de verificación de 6 dígitos/i), '123456'); await user.click(screen.getByRole('button', { name: /confirmar código/i }));
  expect(await screen.findByRole('alert')).toBeInTheDocument(); expect(authValue.login).not.toHaveBeenCalled();
});
it('conserva la institución elegida tras reenvío y verifica con la nueva prueba', async () => {
  vi.useFakeTimers();
  contextualOtp({ resendCooldownSeconds: 1 });
  await act(async () => { vi.advanceTimersByTime(1000); }); vi.useRealTimers();
  apiClient.post.mockResolvedValueOnce({ data: { otpToken: 'renewed', resendCooldownSeconds: 1, message: 'Código reenviado' } });
  const user = userEvent.setup(); await user.selectOptions(screen.getByLabelText('Institución de acceso'), '2');
  await user.click(screen.getByRole('button', { name: /reenviar código$/i }));
  await screen.findByText('Código reenviado'); expect(screen.getByLabelText('Institución de acceso')).toHaveValue('2');
  apiClient.post.mockResolvedValueOnce({ data: { token: 'jwt', role: 'ESTUDIANTE', roles: ['ESTUDIANTE'], institutionId: 2, email: 'p@example.test', name: 'Persona' } });
  await user.type(screen.getByLabelText(/código de verificación de 6 dígitos/i), '123456'); await user.click(screen.getByRole('button', { name: /confirmar código/i }));
  expect(await screen.findByText('Estudiante')).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenLastCalledWith('/api/auth/login/verify-otp', { otpToken: 'renewed', code: '123456', institutionId: 2 });
});
it('no concede plataforma a una respuesta institucional ni atribuye el rechazo a un código incorrecto', async () => {
  apiClient.post.mockResolvedValueOnce({ data: { token: 'jwt', role: 'ESTUDIANTE', roles: ['ESTUDIANTE'], institutionId: 2, email: 'p@example.test', name: 'Persona' } });
  const { authValue } = contextualOtp({ platformAccess: true }); const user = userEvent.setup();
  await user.type(screen.getByLabelText(/código de verificación de 6 dígitos/i), '123456'); await user.click(screen.getByRole('button', { name: /confirmar código/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/utiliza el acceso institucional/);
  expect(authValue.login).not.toHaveBeenCalled();
});
