// src/components/admin/CreateAdminModal.jsx

import { useState } from "react";
import apiClient from "../../api/axiosClient";

export default function CreateAdminModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    lastNamePaterno: "",
    lastNameMaterno: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !form.name.trim() ||
      !form.lastNamePaterno.trim() ||
      !form.email.trim()
    ) {
      setError("Nombre, apellido paterno y correo son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/api/admin/users/admins", {
        name: form.name.trim(),
        lastNamePaterno: form.lastNamePaterno.trim(),
        lastNameMaterno: form.lastNameMaterno.trim() || null,
        email: form.email.trim(),
      });

      onCreated && onCreated();
    } catch (err) {
      console.error("Error creando administrador", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al crear administrador.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center 
        bg-black/40 backdrop-blur-sm 
        px-4 sm:px-0
        animate-fadeIn
      "
      role="dialog"
      aria-modal="true"
    >
      {/* Modal container */}
      <div
        className="
          bg-white rounded-2xl shadow-xl 
          w-full max-w-md p-6 relative 
          border border-slate-200
          animate-scaleIn
        "
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de creación de administrador"
          className="
            absolute top-3 right-3 
            text-slate-400 hover:text-uvBlue 
            focus:outline-none focus:ring-2 focus:ring-uvBlue 
            rounded-full p-1 transition
          "
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-uvBlue mb-1">
          Crear administrador
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Se enviará un correo al nuevo administrador para que active su cuenta
          y configure su contraseña mediante el flujo de primer inicio de sesión.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">

          {/* Nombre */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Nombre
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="
                w-full border border-slate-300 rounded-lg px-3 py-2 
                focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                outline-none transition
              "
              placeholder="Nombre(s)"
              aria-required="true"
            />
          </div>

          {/* Apellido paterno */}
          <div>
            <label
              htmlFor="lastNamePaterno"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Apellido paterno
            </label>
            <input
              id="lastNamePaterno"
              type="text"
              name="lastNamePaterno"
              value={form.lastNamePaterno}
              onChange={handleChange}
              className="
                w-full border border-slate-300 rounded-lg px-3 py-2 
                focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                outline-none transition
              "
              aria-required="true"
            />
          </div>

          {/* Apellido materno */}
          <div>
            <label
              htmlFor="lastNameMaterno"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Apellido materno (opcional)
            </label>
            <input
              id="lastNameMaterno"
              type="text"
              name="lastNameMaterno"
              value={form.lastNameMaterno}
              onChange={handleChange}
              className="
                w-full border border-slate-300 rounded-lg px-3 py-2 
                focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                outline-none transition
              "
            />
          </div>

          {/* Correo */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Correo institucional
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="
                w-full border border-slate-300 rounded-lg px-3 py-2 
                focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                outline-none transition
              "
              placeholder="ejemplo@uv.mx"
              aria-required="true"
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              className="
                text-xs text-red-700 bg-red-50 border border-red-200 
                rounded-lg px-3 py-2 animate-fadeIn
              "
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                px-4 py-2 text-xs rounded-full 
                border border-slate-300 text-slate-700 
                hover:bg-slate-100
                transition
              "
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
                px-4 py-2 text-xs rounded-full 
                bg-uvBlue text-white font-medium shadow 
                hover:bg-[#0f3a6d]
                disabled:opacity-60
                transition
              "
            >
              {loading ? "Creando..." : "Crear administrador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
