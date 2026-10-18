// src/pages/student/StudentNewQuestion.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import apiClient from "../../api/axiosClient";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import PageHeader from "../../components/ui/PageHeader";
import { Alert } from "../../components/ui/States";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || "";

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
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.body.trim()) {
      setError("El título y la descripción son obligatorios.");
      return;
    }
    if (!RECAPTCHA_SITE_KEY || !recaptchaToken) {
      setError("Completa la verificación de seguridad antes de enviar tu pregunta.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        scope: form.scope,
        title: form.title.trim(),
        body: form.body.trim(),
        recaptchaToken,
      };

      const { data } = await apiClient.post("/api/student/questions", payload);

      setSuccess("Pregunta enviada correctamente.");
      navigate(`/student/questions?questionId=${data.id}`);
    } catch (err) {
      console.error("Error al enviar la pregunta", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al enviar la pregunta";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <PageHeader title="Hacer una pregunta" description="Usa este formulario para enviar una duda al sistema de tutorías."
        />
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Procura ser claro y respetuoso. El alcance ayudará a dirigir tu
          pregunta con el tutor adecuado.
        </p>

        <Card className="mt-6 p-5 md:p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Formulario de pregunta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            {error && <Alert tone="error">{error}</Alert>}
            {success && <Alert tone="success">{success}</Alert>}
            <Field id="question-title" label="Título o asunto de la pregunta" required error={!form.title.trim() && error ? "Escribe un título para continuar." : undefined}>
              {props => <input {...props}
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="tl-input"
                placeholder="Ejemplo: ¿Cómo agendo una tutoría?"
              />}
            </Field>

            {/* Alcance */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-4">
              <Field id="question-scope" label="Alcance">
                {props => <select {...props}
                  name="scope"
                  value={form.scope}
                  onChange={handleChange}
                  className="tl-input"
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>}
              </Field>

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
            <Field id="question-body" label="Describe tu pregunta con más detalle" required error={!form.body.trim() && error ? "Describe tu duda para continuar." : undefined}>
              {props => <textarea {...props}
                name="body"
                value={form.body}
                onChange={handleChange}
                className="tl-input h-40 resize-y"
                placeholder="Explica tu situación o duda. Ejemplo: Quiero saber cómo agendar una tutoría para la materia de programación avanzada..."
              />}
            </Field>

            <div aria-live="polite">
              {RECAPTCHA_SITE_KEY ? <ReCAPTCHA sitekey={RECAPTCHA_SITE_KEY} onChange={token => setRecaptchaToken(token || "")} />
                : <Alert tone="warning">La verificación de seguridad no está disponible. Contacta al administrador.</Alert>}
            </div>

            <p className="text-xs text-slate-500">
              Al enviar tu pregunta, esta será asignada a un tutor según el
              alcance seleccionado.
            </p>

            <div className="flex flex-wrap gap-3 mt-2">
              <Button
                type="submit"
                disabled={saving || !RECAPTCHA_SITE_KEY}
                data-cy="student-ask-submit"
                variant="positive"
                busy={saving}
              >
                Enviar pregunta
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/student")}
                variant="secondary"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
