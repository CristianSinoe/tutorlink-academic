// src/layout/AdminLayout.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import Logo from "../components/Logo";

export default function AdminLayout() {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const me = { name: "Admin", lastNamePaterno: "Demo" };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-uvWhite flex flex-col lg:flex-row">
      {/* SIDEBAR DESKTOP */}
      <aside
        className="
          hidden lg:flex lg:flex-col 
          w-72 bg-uvBlue text-white 
          shadow-xl
        "
        aria-label="Navegación administrativa de TutorLink"
      >
        {/* Header sidebar */}
        <div className="px-6 py-5 border-b border-white/15 flex items-center gap-3">
          <Logo variant="monoWhite" className="w-20 h-auto" />
          <div>
            <p className="text-lg font-semibold tracking-tight">TutorLink</p>
            <p className="text-[11px] text-uvWhite/80">Panel administrativo</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
          <NavItem to="/admin" label="Dashboard" />
          <NavItem to="/admin/students" label="Estudiantes" />
          <NavItem to="/admin/tutors" label="Tutores" />
          <NavItem to="/admin/assignments" label="Asignaciones" />
          <NavItem to="/admin/users" label="Usuarios" />
          <NavItem to="/admin/admins" label="Administradores" />
          <NavItem to="/admin/profile" label="Mi perfil" />
        </nav>

        {/* Info usuario + logout */}
        <div className="px-4 pb-5 pt-3 border-t border-white/15">
          <div className="mb-3">
            <p className="text-xs text-uvWhite/70">Conectado como</p>
            <p className="text-sm font-semibold">
              {me ? `${me.name} ${me.lastNamePaterno}` : "Cargando..."}
            </p>
            <p className="text-[11px] text-uvWhite/80 mt-0.5">Rol: Admin</p>
          </div>

          <button
            onClick={handleLogout}
            data-cy="logout-button"
            className="
              w-full py-2.5 
              bg-uvGreen hover:bg-[#1f8644]
              text-white text-sm font-semibold 
              rounded-full 
              transition shadow-sm
              focus:outline-none focus:ring-2 focus:ring-uvWhite/70
            "
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* SIDEBAR MÓVIL (overlay) */}
      {sidebarOpen && (
        <dialog
          open
          className="
            fixed inset-0 z-40 flex lg:hidden
            bg-black/40 backdrop-blur-sm
          "
          aria-modal="true"
        >
          <aside
            className="
              w-72 bg-uvBlue text-white 
              flex flex-col shadow-xl
              animate-slideInLeft
            "
          >
            <div className="px-4 py-4 border-b border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo variant="monoWhite" className="w-9 h-auto" />
                <div>
                  <p className="text-base font-semibold tracking-tight">
                    TutorLink
                  </p>
                  <p className="text-[11px] text-uvWhite/80">
                    Panel administrativo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar menú de navegación"
                className="
                  text-uvWhite/80 hover:text-white 
                  rounded-full p-1
                  focus:outline-none focus:ring-2 focus:ring-uvWhite/80
                "
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
              <NavItem
                to="/admin"
                label="Dashboard"
                onNavigate={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/students"
                label="Estudiantes"
                onNavigate={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/tutors"
                label="Tutores"
                onNavigate={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/assignments"
                label="Asignaciones"
                onNavigate={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/users"
                label="Usuarios"
                onNavigate={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/admins"
                label="Administradores"
                onNavigate={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/admin/profile"
                label="Mi perfil"
                onNavigate={() => setSidebarOpen(false)}
              />
            </nav>

            <div className="px-4 pb-5 pt-3 border-t border-white/15">
              <div className="mb-3">
                <p className="text-xs text-uvWhite/70">Conectado como</p>
                <p className="text-sm font-semibold">
                  {me ? `${me.name} ${me.lastNamePaterno}` : "Cargando..."}
                </p>
                <p className="text-[11px] text-uvWhite/80 mt-0.5">Rol: Admin</p>
              </div>

              <button
                onClick={handleLogout}
                data-cy="logout-button"
                className="
                  w-full py-2.5 
                  bg-uvGreen hover:bg-[#1f8644]
                  text-white text-sm font-semibold 
                  rounded-full 
                  transition shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-uvWhite/70
                "
              >
                Cerrar sesión
              </button>
            </div>
          </aside>

          {/* Zona clickeable para cerrar */}
          <button
            type="button"
            className="flex-1"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          />
        </dialog>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          {/* Izquierda: título + botón menú móvil */}
          <div className="flex items-center gap-3">
            {/* Botón menú móvil */}
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-uvBlue"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú de navegación"
            >
              <span className="sr-only">Abrir menú</span>
              <span aria-hidden="true">☰</span>
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                Panel administrativo
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Gestiona usuarios, tutores, estudiantes y asignaciones de TutorLink.
              </p>
            </div>
          </div>

          {/* Derecha: info usuario en desktop */}
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {me ? `${me.name} ${me.lastNamePaterno}` : "Cargando..."}
              </p>
              <p className="text-[11px] text-slate-500">Administrador</p>
            </div>
            <div className="px-2 py-1 rounded-full bg-uvBlue/5 border border-uvBlue/20 text-[11px] text-uvBlue font-medium">
              Admin
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 bg-slate-50/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} TutorLink. Universidad Veracruzana.
            </p>
            <p className="text-[11px] text-slate-400">
              Módulo administrativo · Diseñado para seguimiento académico.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

NavItem.propTypes = {
  label: PropTypes.string.isRequired,
  onNavigate: PropTypes.func,
  to: PropTypes.string.isRequired,
};

function NavItem({ to, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        `
          flex items-center gap-2 px-3 py-2 rounded-lg font-medium
          transition text-sm
          ${
            isActive
              ? "bg-white text-uvBlue shadow-sm"
              : "text-white/90 hover:bg-uvWhite/10 hover:text-white"
          }
        `
      }
    >
      <span>{label}</span>
    </NavLink>
  );
}
