import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">TutorLink Frontend</p>
        <h1>Baseline tecnico listo para crecer por modulos.</h1>
        <p className="hero-copy">
          Esta primera integracion deja preparada la aplicacion React + Vite con
          estilos globales, build reproducible y una base segura para incorporar
          despues autenticacion, vistas por rol y consumo de API.
        </p>

        <div className="hero-actions">
          <span className="status-pill">React 19</span>
          <span className="status-pill">Vite 7</span>
          <span className="status-pill">Tailwind CSS</span>
        </div>
      </section>
    </main>
  );
}

export default App;
