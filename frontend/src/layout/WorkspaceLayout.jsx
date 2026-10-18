import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Logo from '../components/Logo';
import ContextStatus from '../components/context/ContextStatus';
import { useAuth } from '../context/useAuth';
import { roleLabels } from '../context/sessionStore';

function SidebarContent({ title, items, profilePath, onNavigate }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  return <>
    <div className="flex shrink-0 items-center gap-3 border-b border-white/25 px-5 py-6">
      <Logo variant="monoWhite" className="h-12 w-14" />
      <div><p className="text-xl font-semibold">TutorLink</p><p className="text-sm">{title}</p></div>
    </div>
    <nav aria-label="Navegación principal" className="min-h-0 flex-1 overflow-y-auto p-3">
      {[...items, { to: profilePath, label: 'Mi perfil' }].map(item => <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
        className={({ isActive }) => `mb-1 flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${isActive ? 'bg-white text-uvBlue hover:bg-white' : 'text-white'}`}>
        {item.label}
      </NavLink>)}
    </nav>
    <div className="mt-auto shrink-0 px-4 pb-4" data-testid="sidebar-session">
      <Link to={profilePath} onClick={onNavigate} aria-label="Mi perfil y contexto de trabajo" className="block min-w-0 rounded-lg p-2 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
        <p className="break-words font-semibold">{auth.name}</p>
        <p className="truncate text-sm" title={auth.email}>{auth.email}</p>
        <p className="mt-2 break-words text-sm">{auth.institutionId ? auth.institutionName || `Institución ${auth.institutionId}` : 'Ámbito global de plataforma'}</p>
        <p className="break-words text-sm font-medium">{roleLabels[auth.selectedRole] || 'Elige tu espacio de trabajo'}</p>
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
SidebarContent.propTypes = { title: PropTypes.string.isRequired, items: PropTypes.array.isRequired, profilePath: PropTypes.string.isRequired, onNavigate: PropTypes.func };

function MobileMenu({ onClose, children }) {
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
    <section ref={ref} role="dialog" aria-modal="true" aria-label="Menú de navegación" id="mobile-workspace-menu" className="flex h-dvh w-80 max-w-[90vw] flex-col overflow-y-auto bg-uvBlue text-white shadow-xl">
      <button type="button" className="m-3 min-h-11 self-end rounded-lg px-3 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" onClick={onClose}>Cerrar menú</button>
      {children}
    </section>
  </div>, document.body);
}
MobileMenu.propTypes = { onClose: PropTypes.func.isRequired, children: PropTypes.node };

export default function WorkspaceLayout({ title, items, profilePath, children }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <>
    <div data-workspace-shell data-context-background className="flex min-h-screen min-w-0 bg-slate-50 text-slate-900">
      <a href="#workspace-main" className="tl-skip-link">Saltar al contenido</a>
      <aside aria-label="Menú lateral" className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col overflow-y-auto bg-uvBlue text-white lg:flex">
        <SidebarContent title={title} items={items} profilePath={profilePath} />
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
        <main id="workspace-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-6"><div className="mx-auto max-w-6xl">{children || <Outlet />}</div></main>
        <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">© {new Date().getFullYear()} TutorLink</footer>
      </div>
    </div>
    {open && <MobileMenu onClose={close}><SidebarContent title={title} items={items} profilePath={profilePath} onNavigate={close} /></MobileMenu>}
  </>;
}
WorkspaceLayout.propTypes = { title: PropTypes.string.isRequired, items: PropTypes.array.isRequired, profilePath: PropTypes.string.isRequired, children: PropTypes.node };
