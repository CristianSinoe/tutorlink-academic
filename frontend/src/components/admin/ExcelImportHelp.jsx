import { useState } from "react";
import PropTypes from "prop-types";
import Dialog from "../ui/Dialog";

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

const institutionalGuide = {
  create: 'Filtra por estado de cuenta y datos del perfil académico. Exportar PDF y Exportar Excel descargan todos los resultados filtrados de la institución activa, incluidas las páginas siguientes. La identidad y el estado de la cuenta son de solo lectura.',
  columns: 'name | lastNamePaterno | lastNameMaterno | email | code | career | plan | semester | phone',
  example: 'Mariana | Rosas | Torres | mariana@example.invalid | E001 | ISC | 2026 | 2 | 5550000011',
  result: 'Revisa el reporte: INVITED indica una invitación emitida, SKIPPED una fila omitida y FAILED un error. No se garantiza la entrega del correo. Las filas válidas pueden procesarse aunque otras fallen.',
};
guides.estudiantes = institutionalGuide;
guides.docentes = { ...institutionalGuide, columns: 'name | lastNamePaterno | lastNameMaterno | email | code | department | specialty | phone', example: 'Laura | Martínez | Santos | laura@example.invalid | D001 | Ciencias | Matemáticas | 5550000011' };
guides.tutores = { ...guides.docentes, example: 'Luis | López | Pérez | luis@example.invalid | T001 | Tutorías | Orientación | 5550000011' };
guides.usuarios = { ...institutionalGuide, create: institutionalGuide.create + ' Para importar, selecciona primero Estudiantes, Docentes o Tutores. Una persona estudiante conserva ese rol; DOCENTE y TUTOR pueden combinarse.' };

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
        <Dialog title={`Ayuda de ${section}`} closeLabel="Cerrar ayuda" onClose={() => setOpen(false)} initialFocusSelector="button[aria-label='Cerrar ayuda']">
            <p className="mb-4">{guide.create}</p>
            <h3 className="mb-2 font-semibold">Filtros, exportación e importación</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Crea un archivo <strong>.csv o .xlsx</strong> de hasta 1 MB. Usa la primera hoja y coloca un dato en cada celda. Guarda matrículas y códigos de tutor como texto para conservar ceros iniciales.</li>
              <li>Escribe estos encabezados en la primera fila, en este orden: <span className="block break-words font-mono text-xs">{guide.columns}</span></li>
              <li>Agrega una fila por registro. Ejemplo: <span className="block break-words font-mono text-xs">{guide.example}</span></li>
              <li>Guarda el archivo, pulsa <strong>Importar</strong>, selecciónalo y confirma. {guide.result}</li>
            </ol>
        </Dialog>
      )}
    </>
  );
}

ExcelImportHelp.propTypes = { section: PropTypes.oneOf(["estudiantes", "docentes", "tutores", "usuarios", "asignaciones"]).isRequired };
