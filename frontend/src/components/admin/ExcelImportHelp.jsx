import { useState } from "react";
import PropTypes from "prop-types";

const guides = {
  estudiantes: {
    create: "Crear estudiante abre un formulario para registrar a una persona individualmente y enviarle el enlace de primer acceso por correo.",
    columns: "matricula | email | name | lastNamePaterno | lastNameMaterno | career | plan | semester | phone",
    example: "S230010 | mariana.rosas@uv.mx | Mariana | Rosas | Torres | ISC | 2023 | 2 | 2295550011",
    result: "Los correos ya registrados se omiten. Los nuevos estudiantes reciben un correo para completar su primer acceso.",
  },
  tutores: {
    create: "Crear tutor abre un formulario para registrar a un tutor individualmente y enviarle el enlace de primer acceso por correo.",
    columns: "tutorCode | email | name | lastNamePaterno | lastNameMaterno | department | specialty | phone",
    example: "TUT010 | laura.martinez@uv.mx | Laura | Martínez | Santos | Sistemas | Frontend | 2297001101",
    result: "Los correos ya registrados se omiten. Los nuevos tutores reciben un correo para completar su primer acceso.",
  },
  asignaciones: {
    create: "Para asignar manualmente, abre Ver asignaciones en un tutor, escribe la matrícula de un estudiante existente y confirma la asignación.",
    columns: "tutorCode | matricula",
    example: "TUT001 | S230010",
    result: "El tutor y el estudiante deben existir. Al terminar verás cuántas asignaciones se hicieron y cuántas filas tuvieron errores.",
  },
};

export default function ExcelImportHelp({ section }) {
  const [open, setOpen] = useState(false);
  const guide = guides[section];

  return (
    <>
      <button
        type="button"
        aria-label={`Ayuda de ${section}`}
        title={`Ayuda de ${section}`}
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-uvBlue text-uvBlue font-bold text-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-uvBlue"
      >
        ?
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-label={`Ayuda de ${section}`} className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl text-slate-700">
            <button type="button" aria-label="Cerrar ayuda" onClick={() => setOpen(false)} className="absolute right-4 top-3 rounded-full p-2 text-slate-500 hover:bg-slate-100">✕</button>
            <h2 className="mb-4 pr-8 text-xl font-semibold text-uvBlue">Ayuda</h2>
            <p className="mb-4">{guide.create}</p>
            <h3 className="mb-2 font-semibold">Importar con Excel</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Crea un archivo <strong>.xlsx</strong>. Usa la primera hoja y coloca un dato en cada celda. Guarda matrículas y códigos de tutor como texto para conservar ceros iniciales.</li>
              <li>Escribe estos encabezados en la primera fila, en este orden: <span className="block break-words font-mono text-xs">{guide.columns}</span></li>
              <li>Agrega una fila por registro. Ejemplo: <span className="block break-words font-mono text-xs">{guide.example}</span></li>
              <li>Guarda el archivo, pulsa <strong>Importar Excel</strong>, selecciónalo y confirma. {guide.result}</li>
            </ol>
          </section>
        </div>
      )}
    </>
  );
}

ExcelImportHelp.propTypes = { section: PropTypes.oneOf(["estudiantes", "tutores", "asignaciones"]).isRequired };
