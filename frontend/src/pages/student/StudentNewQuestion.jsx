// src/pages/student/StudentNewQuestion.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";

const SCOPE_OPTIONS = [
  { value: "GENERAL", label: "General" },
  { value: "PROGRAMA", label: "Programa educativo" },
  { value: "PLAN", label: "Plan de estudios" },
  { value: "SEMESTRE", label: "Semestre" },
  { value: "ACADEMICO", label: "Académico" },
];

export default function StudentNewQuestion() {
  const [form, setForm] = useState({
    title: "",
    body: "",
    scope: "GENERAL",
    semesterHint: "",
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      alert("El título y la descripción son obligatorios.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        scope: form.scope,
        title: form.title.trim(),
        body: form.body.trim(),
        recaptchaToken: "prueba-login", // TODO: reemplazar por reCAPTCHA real
      };

      await apiClient.post("/api/student/questions", payload);

      alert("Pregunta enviada correctamente.");
      navigate("/student/questions");
    } catch (err) {
      console.error("Error al enviar la pregunta", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al enviar la pregunta";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-uvBlue tracking-tight">
          Hacer una pregunta
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Usa este formulario para enviar una duda al sistema de tutorías.
          Procura ser claro y respetuoso. El alcance ayudará a dirigir tu
          pregunta con el tutor adecuado.
        </p>

        <div className="mt-6 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 md:p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Formulario de pregunta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Título o asunto de la pregunta
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
                placeholder="Ejemplo: ¿Cómo agendo una tutoría?"
              />
            </div>

            {/* Alcance */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alcance
                </label>
                <select
                  name="scope"
                  value={form.scope}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo opcional de semestre (comentado por ahora)
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Semestre (opcional, solo referencia)
                </label>
                <input
                  type="text"
                  name="semesterHint"
                  value={form.semesterHint}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
                  placeholder="Ejemplo: 5"
                />
              </div>
              */}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Describe tu pregunta con más detalle
              </label>
              <textarea
                name="body"
                value={form.body}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-40 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
                placeholder="Explica tu situación o duda. Ejemplo: Quiero saber cómo agendar una tutoría para la materia de programación avanzada..."
              />
            </div>

            <p className="text-xs text-slate-500">
              Al enviar tu pregunta, esta será asignada a un tutor según el
              alcance seleccionado.
            </p>

            <div className="flex flex-wrap gap-3 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-full bg-uvGreen text-white font-medium text-sm hover:bg-green-600 disabled:opacity-60 transition"
              >
                {saving ? "Enviando..." : "Enviar pregunta"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/student")}
                className="px-6 py-2 rounded-full border border-slate-300 text-slate-700 text-sm hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
