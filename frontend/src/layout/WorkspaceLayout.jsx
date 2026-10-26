import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Logo from '../components/Logo';
import { AdminPresentationContext } from '../context/AdminPresentationContext';
import ContextStatus from '../components/context/ContextStatus';
import { useAuth } from '../context/useAuth';
import { combinedAcademic, roleLabels } from '../context/sessionStore';

function SidebarContent({ title, items, profilePath, onNavigate, appearance = 'default' }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  return <>
    <div className="flex shrink-0 items-center gap-3 border-b border-white/25 px-5 py-6">
      <Logo variant={appearance === 'admin' ? 'sidebar' : 'monoWhite'} className="h-12 w-14" />
      <div><p className="text-xl font-semibold">TutorLink</p><p className="text-sm">{title}</p></div>
    </div>
    <nav aria-label="Navegación principal" className="min-h-0 flex-1 overflow-y-auto p-3">
      {[...items, { to: profilePath, label: 'Mi perfil', group: 'Cuenta', icon: 'profile' }].map((item, index, links) => <div key={item.to}>
        {appearance === 'admin' && item.group !== links[index - 1]?.group && <p className="tl-nav-group">{item.group || 'Navegación'}</p>}
        <NavLink to={item.to} end={item.end} onClick={onNavigate}
          className={({ isActive }) => appearance === 'admin' ? `tl-admin-nav-link${isActive ? ' is-active' : ''}` : `mb-1 flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${isActive ? 'bg-white text-uvBlue hover:bg-white' : 'text-white'}`}>
          {appearance === 'admin' && <NavIcon name={item.icon} />}{item.label}
        </NavLink>
      </div>)}
    </nav>
    <div className="mt-auto shrink-0 px-4 pb-4" data-testid="sidebar-session">
      <Link to={profilePath} onClick={onNavigate} aria-label="Mi perfil y contexto de trabajo" className="block min-w-0 rounded-lg p-2 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
        <p className="break-words font-semibold">{auth.name}</p>
        <p className="truncate text-sm" title={auth.email}>{auth.email}</p>
        <p className="mt-2 break-words text-sm">{auth.institutionId ? auth.institutionName || `Institución ${auth.institutionId}` : 'Ámbito global de plataforma'}</p>
        <p className="break-words text-sm font-medium">{combinedAcademic(auth) && ['DOCENTE', 'TUTOR'].includes(auth.selectedRole) ? 'Docencia y tutorías' : roleLabels[auth.selectedRole] || 'Elige tu espacio de trabajo'}</p>
      </Link>
      <div className="my-3 border-t border-white/30" />
      <button type="button" data-cy="logout-button" onClick={() => { onNavigate?.(); logout(); navigate('/login'); }}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0"><path d="M9 5H4v14h5M14 8l4 4-4 4M8 12h10" /></svg>
        Cerrar sesión
      </button>
    </div>
  </>;
}
SidebarContent.propTypes = { title: PropTypes.string.isRequired, items: PropTypes.array.isRequired, profilePath: PropTypes.string.isRequired, onNavigate: PropTypes.func, appearance: PropTypes.string };

function MobileMenu({ onClose, children, appearance = 'default' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const backgrounds = [...document.querySelectorAll('[data-workspace-shell]')];
    backgrounds.forEach(el => el.setAttribute('inert', ''));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.querySelector('button')?.focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const elements = [...dialog.querySelectorAll('button:not([disabled]), a[href]')];
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    dialog.addEventListener('keydown', keydown);
    const media = window.matchMedia?.('(min-width: 1024px)');
    media?.addEventListener('change', onClose);
    return () => {
      media?.removeEventListener('change', onClose);
      dialog.removeEventListener('keydown', keydown);
      backgrounds.forEach(el => el.removeAttribute('inert'));
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);
  return createPortal(<div className="fixed inset-0 z-50 bg-black/50" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} role="dialog" aria-modal="true" aria-label="Menú de navegación" id="mobile-workspace-menu" className={`flex h-dvh w-80 max-w-[90vw] flex-col overflow-y-auto bg-uvBlue text-white shadow-xl ${appearance === 'admin' ? 'tl-admin tl-admin-drawer' : ''}`}>
      <button type="button" className="m-3 min-h-11 self-end rounded-lg px-3 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" onClick={onClose}>Cerrar menú</button>
      {children}
    </section>
  </div>, document.body);
}
MobileMenu.propTypes = { onClose: PropTypes.func.isRequired, children: PropTypes.node, appearance: PropTypes.string };

export default function WorkspaceLayout({ title, items, profilePath, children, appearance = 'admin' }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <AdminPresentationContext.Provider value={appearance === 'admin'}>
    <div data-workspace-shell data-context-background className={`flex min-h-screen min-w-0 bg-slate-50 text-slate-900 ${appearance === 'admin' ? 'tl-admin tl-admin-shell' : ''}`} >
      <a href="#workspace-main" className="tl-skip-link">Saltar al contenido</a>
      <aside aria-label="Menú lateral" className="tl-workspace-sidebar sticky top-0 hidden h-dvh w-72 shrink-0 flex-col overflow-y-auto bg-uvBlue text-white lg:flex">
        <SidebarContent appearance={appearance} title={title} items={items} profilePath={profilePath} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" aria-expanded={open} aria-controls={open ? 'mobile-workspace-menu' : undefined} onClick={() => setOpen(true)} className="tl-button-secondary lg:hidden" aria-label="Abrir menú">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <p className="font-semibold">{title}</p>
          </div>
          <ContextStatus />
        </header>
        <main id="workspace-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-6"><div className={appearance === 'admin' ? 'tl-admin-content' : 'mx-auto max-w-6xl'}>{children || <Outlet />}</div></main>
        <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">© {new Date().getFullYear()} TutorLink</footer>
      </div>
    </div>
    {open && <MobileMenu appearance={appearance} onClose={close}><SidebarContent appearance={appearance} title={title} items={items} profilePath={profilePath} onNavigate={close} /></MobileMenu>}
  </AdminPresentationContext.Provider>;
}
WorkspaceLayout.propTypes = { title: PropTypes.string.isRequired, items: PropTypes.array.isRequired, profilePath: PropTypes.string.isRequired, children: PropTypes.node, appearance: PropTypes.oneOf(['default', 'admin']) };

const iconPaths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  student: 'm2 8 10-5 10 5-10 5z M6 10v6c4 4 8 4 12 0v-6 M22 8v9',
  teacher: 'M4 3h16v12H4z M8 21l4-6 4 6 M8 7h8 M8 11h5',
  tutor: 'M21 11a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4 M8 9h8 M8 13h5',
  calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 11h16',
  book: 'M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-3-2-7-2-10 1z M12 5v15',
  groups: 'M3 3h7v7H3z M14 14h7v7h-7z M17 3v7H3 M7 14v7h3',
  assignment: 'M8 4H4v18h16V4h-4 M8 2h8v5H8z M8 12h8 M8 16h6',
  mail: 'M3 5h18v14H3z m0 0 9 7 9-7',
  profile: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2 M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
};
function NavIcon({ name }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0"><path d={iconPaths[name] || iconPaths.users} /></svg>;
}
NavIcon.propTypes = { name: PropTypes.string };
