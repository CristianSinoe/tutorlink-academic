// src/layout/TutorLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import Logo from "../components/Logo";

export default function TutorLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/tutor", label: "Dashboard", end: true },
    { to: "/tutor/pending", label: "Preguntas pendientes" },
    { to: "/tutor/history", label: "Historial de respuestas" },
    { to: "/tutor/profile", label: "Mi perfil" },
  ];

  const desktopLinkBase =
    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition";
  const mobileLinkBase =
    "px-4 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap";

  const getDesktopClasses = (isActive) =>
    isActive
      ? `${desktopLinkBase} bg-uvBlue text-white shadow-sm`
      : `${desktopLinkBase} text-slate-700 hover:bg-slate-50`;

  const getMobileClasses = (isActive) =>
    isActive
      ? `${mobileLinkBase} bg-uvBlue text-white shadow-sm`
      : `${mobileLinkBase} text-slate-700 bg-slate-100 hover:bg-slate-200`;

  return (
    <div className="min-h-screen bg-uvWhite flex flex-col md:flex-row text-slate-900">
      {/* SIDEBAR DESKTOP */}
      <aside
        className="
          hidden md:flex w-64 
          bg-white border-r border-slate-200 
          flex-col shadow-sm
        "
        aria-label="Navegación tutor TutorLink"
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
          <Logo variant="horizontal" className="w-45 h-auto" />
        </div>

        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => getDesktopClasses(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-5 pt-2 border-t border-slate-200">
          <button
            onClick={handleLogout}
            data-cy="logout-button"
            className="
              w-full inline-flex items-center justify-center 
              px-4 py-2 rounded-full 
              bg-red-500 hover:bg-red-600 
              text-white text-sm font-semibold 
              shadow-sm transition
              focus:outline-none focus:ring-2 focus:ring-red-300
            "
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3">
            {/* Fila superior: título + logout móvil */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Logo compacto solo mobile */}
                <div className="md:hidden">
                  <Logo variant="isotype" className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-semibold text-slate-800">
                    Panel de tutor
                  </h1>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Gestiona y responde las preguntas de tus estudiantes.
                  </p>
                </div>
              </div>

              {/* Logout móvil */}
              <div className="flex items-center gap-3 md:hidden">
                <button
                  onClick={handleLogout}
                  data-cy="logout-button"
                  className="
                    inline-flex items-center justify-center 
                    px-4 py-1.5 rounded-full 
                    bg-red-500 text-white 
                    text-xs font-semibold shadow-sm 
                    hover:bg-red-600 transition
                    focus:outline-none focus:ring-2 focus:ring-red-300
                  "
                >
                  Cerrar sesión
                </button>
              </div>

              {/* Logout + info en desktop */}
              <div className="hidden md:flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-[11px] text-slate-500">
                    Tutor académico
                  </p>
                  <p className="text-xs text-slate-400">
                    Universidad Veracruzana
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  data-cy="logout-button"
                  className="
                    inline-flex items-center justify-center 
                    px-4 py-2 rounded-full 
                    bg-red-500 text-white 
                    text-xs sm:text-sm font-semibold shadow-sm 
                    hover:bg-red-600 transition
                    focus:outline-none focus:ring-2 focus:ring-red-300
                  "
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            {/* NAV MOBILE: pills */}
            <nav
              className="flex md:hidden gap-2 pb-1 overflow-x-auto"
              aria-label="Navegación tutor"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => getMobileClasses(isActive)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} TutorLink · Módulo Tutor.
            </p>
            <p className="text-[11px] text-slate-400">
              Facilita la comunicación y seguimiento con tus estudiantes.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
