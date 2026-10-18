describe('Módulo académico con contrato simulado', () => {
  const page = content => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0 });
  beforeEach(() => {
    cy.intercept('GET', '/api/admin/academic/periods*', { body: page([{ id: 1, code: '2027-A', name: 'Primavera', starts_on: '2027-01-01', ends_on: '2027-06-30', status: 'ACTIVE' }]) });
    cy.intercept('GET', '/api/admin/academic/courses*', { body: page([{ id: 2, code: 'MAT', name: 'Matemáticas', active: true }]) });
    cy.intercept('GET', '/api/admin/academic/groups*', { body: page([{ id: 3, code: 'A', name: 'Grupo A', course_id: 2, period_id: 1, active: true }]) });
  });
  it('muestra las rutas ADMIN y sus nombres de catálogo', () => {
    cy.visitAsRole('/admin/groups', 'admin'); cy.get('main').find('h1').should('have.text', 'Grupos'); cy.contains('Matemáticas').should('be.visible'); cy.contains('Primavera').should('be.visible');
  });
  it('muestra Mis materias para DOCENTE y ESTUDIANTE sin enlaces futuros', () => {
    cy.intercept('GET', '/api/teacher/courses*', { body: page([{ id: 3, code: 'A', name: 'Grupo A', course_name: 'Matemáticas', period_name: 'Primavera' }]) });
    cy.visitAsRole('/teacher/courses', 'teacher'); cy.get('main').find('h1').should('have.text', 'Mis materias'); cy.contains('Matemáticas').should('be.visible'); cy.contains(/tareas|asistencia|materiales/i).should('not.exist');
    cy.intercept('GET', '/api/student/courses*', { body: page([]) }); cy.visitAsRole('/student/courses', 'student'); cy.contains('No tienes materias activas.').should('be.visible');
  });
});
