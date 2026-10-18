// UI verification with explicitly simulated API contracts; not backend E2E.
const paged = content => ({ content, totalElements: content.length, totalPages: content.length ? 1 : 0, page: 0, size: 100 });
describe('Paginación, detalles y modales con contratos simulados', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/admin/academic/periods*', { body: paged([{ id: 1, code: 'P', name: 'Periodo', starts_on: '2027-01-01', ends_on: '2027-06-30', status: 'ACTIVE' }]) });
    cy.intercept('GET', '/api/admin/academic/courses*', { body: paged([{ id: 2, code: 'C', name: 'Materia', description: 'Descripción', active: true }]) });
    cy.intercept('GET', '/api/admin/academic/groups*', { body: paged([{ id: 3, code: 'A', name: 'Grupo A', course_id: 2, period_id: 1, active: true }]) });
    cy.intercept('GET', '/api/admin/academic/groups/3/teachers*', { body: paged(Array.from({ length: 12 }, (_, i) => ({ teacherId: i + 1, code: `D${i + 1}`, name: `Docente ${i + 1}` }))) });
    cy.intercept('GET', '/api/admin/academic/groups/3/enrollments*', { body: paged(Array.from({ length: 12 }, (_, i) => ({ studentId: i + 1, matricula: `S${i + 1}`, name: `Estudiante ${i + 1}`, status: 'ACTIVE' }))) });
    cy.intercept('GET', '/api/admin/institution/users*', { body: { items: [], total: 0, size: 100, page: 0 } });
  });
  [320, 375, 768, 1024, 1440].forEach(width => {
    it(`mantiene el grupo y su paginación dentro de la pantalla a ${width}px`, () => {
      cy.viewport(width, 900); cy.visitAsRole('/admin/groups', 'admin');
      cy.contains('button', 'Gestionar').click();
      cy.get('[role=dialog]').should('be.visible').then($dialog => {
        const rect = $dialog[0].getBoundingClientRect(); expect(rect.left).to.be.at.least(0); expect(rect.right).to.be.at.most(width); expect(rect.height).to.be.at.most(900);
      });
      cy.get('nav[aria-label="Páginas de docentes asignados"]').within(() => cy.get('button[aria-label="Página 3"]').click());
      cy.get('[role="region"][aria-label="Docentes asignados"]').should('contain', 'Docente 11').find('tbody tr').should('have.length', 2);
      cy.get('nav[aria-label="Páginas de inscripciones"]').within(() => { cy.get('button[aria-label="Página 3"]').click(); cy.get('button[aria-label="Página 3"]').should('have.attr', 'aria-current', 'page'); });
      cy.get('[role=dialog]').find('button[aria-label="Cerrar ventana"]').focus().type('{esc}'); cy.get('[role=dialog]').should('not.exist');
      cy.contains('button', 'Gestionar').should('be.focused');
    });
  });
  it('limita las asignaciones del tutor a cinco filas y permite saltar a la última página', () => {
    cy.viewport(1440, 900);
    cy.intercept('GET', '/api/admin/users/tutor-students', { body: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, tutorCode: 'T1', tutorName: 'Tutor de prueba', tutorEmail: 'tutor@example.invalid', studentMatricula: `S${i + 1}`, studentName: `Estudiante ${i + 1}`, studentEmail: `s${i + 1}@example.invalid` })) });
    cy.visitAsRole('/admin/assignments', 'admin'); cy.contains('button', 'Ver asignaciones').click();
    cy.get('[role=dialog]').find('tbody tr').should('have.length', 5);
    cy.get('nav[aria-label="Páginas de estudiantes asignados"]').find('button[aria-label="Página 3"]').click();
    cy.get('[role=dialog]').find('tbody tr').should('have.length', 2);
    cy.get('[role=dialog]').should('contain', 'Estudiante 12').then($dialog => expect($dialog[0].getBoundingClientRect().height).to.be.at.most(900));
  });
  ['periods', 'courses'].forEach(kind => {
    it(`guarda cambios desde detalles de ${kind}`, () => {
      cy.intercept('PUT', `/api/admin/academic/${kind}/*`, { statusCode: 204 }).as('update');
      cy.visitAsRole(`/admin/${kind}`, 'admin'); cy.contains('button', 'Ver detalles').click();
      cy.get(`[id="${kind}-name"]`).clear().type('Nombre editado'); cy.contains('button', 'Guardar cambios').click();
      cy.wait('@update').its('request.body.name').should('eq', 'Nombre editado'); cy.get('[role=dialog]').should('not.exist');
    });
  });
});
