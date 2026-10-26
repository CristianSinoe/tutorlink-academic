// Presentation evidence uses simulated contracts, separately from real E2E.
const page = content => ({ content, totalElements: content.length, totalPages: 1, page: 0, size: 10 });
describe('Rediseño administrativo: evidencia visual', () => {
  beforeEach(() => {
    cy.mockAdminApis();
    cy.intercept('GET', '/api/admin/academic/periods*', { body: page([{ id: 1, code: '2027-A', name: 'Primavera', starts_on: '2027-01-01', ends_on: '2027-06-30', status: 'ACTIVE' }]) });
    cy.intercept('GET', '/api/admin/academic/courses*', { body: page([{ id: 2, code: 'MAT', name: 'Matemáticas', description: 'Fundamentos y aplicaciones', active: true }]) });
    cy.intercept('GET', '/api/admin/academic/groups*', { body: page([{ id: 3, code: 'A', name: 'Grupo A', course_id: 2, period_id: 1, active: true }]) });
    cy.intercept('GET', '/api/admin/academic/groups/3/teachers*', { body: page([{ teacherId: 1, code: 'D-1', name: 'Laura', lastNamePaterno: 'Martínez', department: 'Ciencias', specialty: 'Matemáticas' }]) });
    cy.intercept('GET', '/api/admin/academic/groups/3/enrollments*', { body: page([{ studentId: 1, matricula: 'S-1', name: 'Ana', career: 'ISC', semester: 2, status: 'ACTIVE' }]) });
  });
  [375, 1366].forEach(width => {
    it(`captura listados y tareas administrativas a ${width}px`, () => {
      const phase = Cypress.env('DESIGN_CAPTURE') || 'after';
      cy.viewport(width, 768);
      const capture = name => {
        cy.document().then(doc => {
          const dialog = doc.querySelector('[role=dialog]');
          if (dialog) {
            const bounds = dialog.getBoundingClientRect();
            expect(bounds.left, 'modal dentro del borde izquierdo').to.be.at.least(0);
            expect(bounds.right, 'modal dentro del borde derecho').to.be.at.most(width);
          }
        });
        cy.screenshot(`${phase}-${width}-${name}`, { capture: 'viewport' });
      };
      cy.visitAsRole('/admin/users', 'admin'); cy.contains('td', 'tutor.e2e@example.test').should('be.visible'); capture('usuarios');
      cy.contains('button', 'Ver detalle').first().click(); cy.get('[role=dialog]').should('contain', 'Cuenta global'); capture('perfil');
      cy.visitAsRole('/admin/assignments', 'admin'); cy.contains('button', 'Ver asignaciones').first().click(); cy.get('[role=dialog]').should('be.visible'); capture('asignaciones');
      cy.visitAsRole('/admin/groups', 'admin'); cy.contains('button', 'Gestionar').click(); cy.get('[role=dialog]').should('contain', 'Laura'); capture('grupo');
      cy.visitAsRole('/admin/periods', 'admin'); cy.contains('button', 'Crear periodo').click(); cy.get('[role=dialog]').should('be.visible'); capture('formulario');
    });
  });
});
