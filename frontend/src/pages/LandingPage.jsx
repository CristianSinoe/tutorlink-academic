import Logo from '../components/Logo';
import './LandingPage.css';

function PreviewIcon({ children }) {
  return <span className="tl-landing-preview-icon" aria-hidden="true">{children}</span>;
}

export default function LandingPage() {
  return (
    <main className="tl-landing">
      <div className="tl-landing-glow tl-landing-glow-one" aria-hidden="true" />
      <div className="tl-landing-glow tl-landing-glow-two" aria-hidden="true" />

      <nav className="tl-landing-nav" aria-label="Presentación de TutorLink">
        <Logo variant="black" className="tl-landing-logo" />
        <div className="tl-landing-nav-links" aria-label="Secciones de la presentación">
          <a href="#soluciones">Soluciones</a>
          <a href="#experiencia">Experiencia</a>
          <button type="button" className="tl-landing-nav-button" aria-disabled="true" title="Disponible próximamente">
            Solicitar acceso
          </button>
        </div>
      </nav>

      <section className="tl-landing-hero" aria-labelledby="landing-title">
        <div className="tl-landing-copy">
          <p className="tl-landing-kicker"><span /> Plataforma educativa conectada</p>
          <h1 id="landing-title">El acompañamiento académico empieza aquí.</h1>
          <p className="tl-landing-lead">
            TutorLink reúne instituciones, docentes, estudiantes y tutores en una experiencia clara para aprender, orientar y avanzar juntos.
          </p>
          <div className="tl-landing-actions">
            <button type="button" className="tl-landing-primary" aria-disabled="true" title="Vista de demostración">
              Conocer TutorLink <span aria-hidden="true">↗</span>
            </button>
            <button type="button" className="tl-landing-secondary" aria-disabled="true" title="Disponible próximamente">
              Ver la experiencia
            </button>
          </div>
          <p className="tl-landing-note"><span className="tl-landing-status-dot" /> Vista de presentación · Las acciones estarán disponibles próximamente</p>
        </div>

        <div className="tl-landing-visual" id="experiencia" aria-label="Vista previa de un espacio académico">
          <div className="tl-landing-orbit tl-landing-orbit-a" aria-hidden="true" />
          <div className="tl-landing-orbit tl-landing-orbit-b" aria-hidden="true" />
          <div className="tl-landing-window">
            <div className="tl-landing-window-top"><span /><span /><span /><b>Mi espacio académico</b></div>
            <div className="tl-landing-window-body">
              <aside className="tl-landing-mini-sidebar">
                <div className="tl-landing-mini-mark">TL</div>
                <i /><i /><i /><i />
                <div className="tl-landing-mini-avatar">SD</div>
              </aside>
              <div className="tl-landing-mini-content">
                <div className="tl-landing-mini-heading"><div><small>MI RESUMEN</small><h2>Todo en un mismo lugar</h2></div><span>Hoy · 24 oct</span></div>
                <div className="tl-landing-mini-stats"><div><small>Materias activas</small><strong>06</strong></div><div><small>Actividades pendientes</small><strong>03</strong></div><div><small>Progreso del periodo</small><strong>78%</strong></div></div>
                <div className="tl-landing-mini-panel"><div className="tl-landing-panel-title"><span>Próximas actividades</span><em>Ver todas</em></div><p><PreviewIcon>✦</PreviewIcon><span><b>Proyecto de programación</b><small>Entrega · Mañana, 23:59</small></span><strong className="tl-landing-badge">En curso</strong></p><p><PreviewIcon>✓</PreviewIcon><span><b>Orientación académica</b><small>Sesión con tu tutor · Viernes</small></span><strong className="tl-landing-badge tl-landing-badge-green">Agendada</strong></p></div>
              </div>
            </div>
          </div>
          <div className="tl-landing-float tl-landing-float-a"><span>✓</span><div><b>Avance guardado</b><small>Tu progreso está al día</small></div></div>
          <div className="tl-landing-float tl-landing-float-b"><span>✦</span><div><b>Comunidad activa</b><small>Conecta con tu institución</small></div></div>
        </div>
      </section>

      <section className="tl-landing-trust" aria-label="Beneficios de TutorLink">
        <p>Una experiencia pensada para cada persona que hace posible el aprendizaje</p>
        <div><span>Instituciones conectadas</span><span>Seguimiento académico</span><span>Acompañamiento humano</span><span>Información clara y segura</span></div>
      </section>

      <section className="tl-landing-solutions" id="soluciones" aria-labelledby="solutions-title">
        <div className="tl-landing-section-heading"><p className="tl-landing-kicker"><span /> Una plataforma, varios espacios</p><h2 id="solutions-title">La vida académica, con más claridad.</h2><p>Diseñada para que cada rol encuentre lo que necesita sin perder de vista lo importante.</p></div>
        <div className="tl-landing-cards"><article><div className="tl-landing-card-icon tl-landing-card-blue">⌂</div><h3>Instituciones</h3><p>Organiza comunidades, periodos y espacios de trabajo desde un contexto seguro.</p><span>Gestión conectada</span></article><article><div className="tl-landing-card-icon tl-landing-card-green">◒</div><h3>Docencia</h3><p>Convierte tus materias y actividades en un recorrido comprensible para tu grupo.</p><span>Aprendizaje activo</span></article><article><div className="tl-landing-card-icon tl-landing-card-purple">♡</div><h3>Tutorías</h3><p>Acompaña a cada estudiante con seguimiento, orientación y conversaciones oportunas.</p><span>Acompañamiento humano</span></article></div>
      </section>

      <footer className="tl-landing-footer"><Logo variant="black" className="tl-landing-footer-logo" /><span>TutorLink · Plataforma de acompañamiento académico</span><span className="tl-landing-footer-muted">Presentación visual · 2026</span></footer>
    </main>
  );
}
