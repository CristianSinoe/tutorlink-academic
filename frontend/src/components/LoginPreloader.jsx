// src/components/LoginPreloader.jsx
import { useEffect, useState } from "react";
import Logo from "./Logo";

const FIRST_LINES = ["Aprender,", "Acompañar y", "Conectar."];
const SECOND_LINES = ["Tutorías académicas", "con respaldo institucional."];

export default function LoginPreloader({ onDone }) {
  const [phase, setPhase] = useState(0); // 0 = primeras palabras, 1 = frase grande

  useEffect(() => {
    // Cambia a la segunda fase
    const phaseTimer = setTimeout(() => setPhase(1), 3000);

    // Termina el preloader
    const doneTimer = setTimeout(() => {
      if (onDone) onDone();
    }, 6000);

    return () => {
      clearTimeout(phaseTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-uvBlue via-uvBlue to-uvGreen text-white relative overflow-hidden">
      {/* blobs como en el login */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Branding arriba a la izquierda */}
      <div className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <Logo variant="monoWhite" className="h-10" />
        <span className="text-xs font-semibold uppercase text-white/80">
          TutorLink
        </span>
      </div>

      {/* Contenido central */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          {phase === 0 ? (
            <>
              <p className="text-1xl text-white/80 mb-10">
                Acompañamiento académico UV
              </p>
              <div className="space-y-1">
                {FIRST_LINES.map((line, i) => (
                  <p
                    key={line}
                    className="text-3xl sm:text-2xl font-semibold animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.30}s` }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-1xl sm:text-sm text-white/80 mb-2">
                Bienvenido a TutorLink
              </p>
              <div className="space-y-1 sm:space-y-2">
                {SECOND_LINES.map((line, i) => (
                  <p
                    key={line}
                    className="text-3xl sm:text-4xl md:text-5xl font-bold animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.25}s` }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
