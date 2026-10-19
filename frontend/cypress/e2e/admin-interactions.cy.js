// Simulated contracts: verify presentation without claiming backend integration.
const page = content => ({ content, totalElements: content.length, totalPages: 1, page: 0, size: 10 });
describe('Interacción accesible del panel administrativo', () => {
  beforeEach(() => {
    cy.viewport(1366, 768); cy.mockAdminApis();
    cy.intercept('GET', '/api/admin/academic/periods*', { body: page([{ id: 1, code: 'P', name: 'Periodo', starts_on: '2027-01-01', ends_on: '2027-06-30', status: 'ACTIVE' }]) });
    cy.intercept('GET', '/api/admin/academic/courses*', { body: page([{ id: 2, code: 'C', name: 'Materia', active: true }]) });
  });
  it('agrupa las rutas, conserva el logo y diferencia perfil e institución', () => {
    cy.visitAsRole('/admin/users', 'admin');
    cy.get('aside').should('be.visible').within(() => {
      ['Resumen', 'Comunidad', 'Gestión académica', 'Tutorías', 'Vinculación', 'Cuenta'].forEach(group => cy.contains('.tl-nav-group', group).should('exist'));
      cy.get('img').should('have.attr', 'src', '/tutorlink-isotype.svg');
      cy.get('a[aria-current=page]').should('contain', 'Usuarios');
      cy.get('[data-testid=sidebar-session]').should('contain', 'Escuela de pruebas');
    });
    cy.get('header').should('not.contain', 'admin.e2e@example.test');
  });
  it('conserva los valores al cancelar el cierre y restaura el foco al descartar', () => {
    cy.visitAsRole('/admin/periods', 'admin'); cy.contains('button', 'Crear periodo').click();
    cy.get('#periods-name').type('Borrador sin guardar'); cy.contains('[role=dialog] button', 'Cancelar').click();
    cy.get('[role=dialog]').should('contain', 'Hay cambios sin guardar'); cy.focused().should('have.text', 'Seguir editando');
    cy.contains('button', 'Seguir editando').click(); cy.get('#periods-name').should('have.value', 'Borrador sin guardar');
    cy.get('[role=dialog] button[aria-label="Cerrar ventana"]').click(); cy.contains('button', 'Descartar cambios').click();
    cy.get('[role=dialog]').should('not.exist'); cy.contains('button', 'Crear periodo').should('be.focused');
  });
  it('bloquea cierres durante el guardado y permite corregir un error recuperable', () => {
    cy.intercept('POST', '/api/admin/academic/periods', { statusCode: 409, delay: 1200, body: { message: 'El código del periodo ya existe.' } }).as('createPeriod');
    cy.visitAsRole('/admin/periods', 'admin'); cy.contains('button', 'Crear periodo').click();
    cy.get('#periods-code').type('P'); cy.get('#periods-name').type('Periodo repetido'); cy.get('#period-start').type('2027-01-01'); cy.get('#period-end').type('2027-06-30');
    cy.get('[role=dialog]').contains('button', /^Crear$/).click(); cy.get('[aria-label="Cerrar ventana"]').should('be.disabled');
    cy.wait('@createPeriod'); cy.get('[role=dialog]').should('contain', 'El código del periodo ya existe.'); cy.get('#periods-name').should('have.value', 'Periodo repetido');
  });
  it('confirma el retiro de tutoría dentro del diálogo antes de enviar DELETE', () => {
    cy.intercept('DELETE', '/api/admin/users/tutor-students/*', { statusCode: 204 }).as('remove');
    cy.visitAsRole('/admin/assignments', 'admin'); cy.contains('button', 'Ver asignaciones').first().click();
    cy.contains('[role=dialog] button', 'Quitar').first().click(); cy.get('@remove.all').should('have.length', 0);
    cy.contains('[role=dialog] button', 'Confirmar retiro').click(); cy.wait('@remove');
    cy.get('[role=dialog]').should('not.exist'); cy.contains('Asignación eliminada correctamente.').should('be.visible');
  });
  it('mantiene reflow con texto ampliado al 200% sin scroll horizontal de página', () => {
    cy.viewport(683, 384); cy.visitAsRole('/admin/users', 'admin');
    cy.document().then(doc => { doc.documentElement.style.fontSize = '225%'; });
    cy.get('td').should('contain', 'Tutor E2E');
    cy.window().then(win => expect(win.document.documentElement.scrollWidth).to.be.at.most(win.innerWidth + 1));
    cy.get('[aria-label="Abrir menú"]').click(); cy.get('[role=dialog]').should('be.visible');
    cy.get('[role=dialog]').contains('button', 'Cerrar sesión').scrollIntoView().should('be.visible');
    cy.get('[role=dialog]').contains('button', 'Cerrar menú').scrollIntoView().focus().type('{esc}'); cy.get('[aria-label="Abrir menú"]').should('be.focused');
  });
});
