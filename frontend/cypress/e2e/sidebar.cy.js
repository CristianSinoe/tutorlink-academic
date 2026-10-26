// Real browser interactions; HTTP responses are simulated, without production authentication bypasses.
const email = 'una-persona-con-correo-principal-muy-largo@example.test';
const roles = [
  { role: 'ADMIN', home: '/admin', profile: '/admin/profile' },
  { role: 'DOCENTE', home: '/teacher', profile: '/teacher/profile' },
  { role: 'TUTOR', home: '/tutor', profile: '/tutor/profile' },
  { role: 'ESTUDIANTE', home: '/student', profile: '/student/info' },
  { role: 'SUPER_ADMIN', home: '/context', profile: '/context/profile' },
  { role: 'PLATFORM_SUPER_ADMIN', home: '/platform', profile: '/platform/profile' },
];
function visitRole({ role, home }) {
  const global = role === 'PLATFORM_SUPER_ADMIN';
  const actor = { token: 'context', role: global ? 'SUPER_ADMIN' : role, roles: [role], institutionId: global ? null : 1, name: 'Persona de prueba', email };
  const options = role === 'SUPER_ADMIN' || global ? [] : [{ institutionId: 1, name: 'Escuela de prueba', roles: [role] }];
  cy.mockRecaptcha();
  cy.intercept('GET', '/api/auth/institutions', { body: options });
  cy.intercept('GET', '/api/platform/institutions', { body: [{ id: 1, name: 'Escuela de prueba', status: 'ACTIVE' }] });
  cy.intercept('POST', '/api/auth/context', { body: actor });
  cy.intercept('GET', '/api/me', { body: { id: 1, name: actor.name, email, role: actor.role } });
  cy.intercept('GET', '/api/tutor/profile', { body: {} });
  cy.intercept('GET', '/api/admin/dashboard/summary', { body: {} });
  cy.intercept('GET', '/api/admin/questions/recent*', { body: [] });
  cy.intercept('GET', '/api/tutor/dashboard/summary', { body: {} });
  cy.intercept('GET', '/api/tutor/questions/recent*', { body: [] });
  ['/api/teacher/courses*', '/api/teacher/tasks*', '/api/teacher/questions*'].forEach(url => cy.intercept('GET', url, { body: { content: [], page: 0, size: 1, totalElements: 0, totalPages: 0 } }));
  cy.intercept('GET', '/api/student/questions/my*', { body: { content: [] } });
  cy.visit(home, { onBeforeLoad(win) { win.localStorage.setItem('auth', JSON.stringify({ version: 2, ...actor, selectedRole: role })); } });
  // Context restoration precedes the sidebar; do not race the four-second default.
  cy.get('[data-workspace-shell]', { timeout: 15000 }).should('be.visible');
}
describe('Sidebar y perfil compartidos', () => {
  roles.forEach(entry => {
    it(`identidad al pie y contexto en Mi perfil: ${entry.role}`, () => {
      cy.viewport(1440, 900); visitRole(entry);
      cy.get('[data-workspace-shell]').should('have.class', 'tl-admin-shell');
      cy.get('aside[aria-label="Menú lateral"]').should('have.css', 'background-color', 'rgb(241, 244, 249)');
      cy.get('aside nav a').first().should('have.class', 'tl-admin-nav-link');
      if (['TUTOR', 'ESTUDIANTE', 'DOCENTE'].includes(entry.role)) cy.screenshot(`workspace-${entry.role.toLowerCase()}`, { capture: 'viewport', scale: true });
      cy.get('button').filter(':visible').each($button => {
        const button = $button[0];
        expect(getComputedStyle(button).borderRadius, 'radio compartido').to.equal('8px');
        expect(button.getBoundingClientRect().height, 'objetivo táctil').to.be.at.least(44);
      });
      cy.get('aside[aria-label="Menú lateral"]').should('be.visible').within(() => {
        cy.get('[data-testid="sidebar-session"]').should('contain', 'Persona de prueba').and('contain', email);
        cy.contains('a', 'Mi perfil').click();
      });
      cy.location('pathname').should('eq', entry.profile);
      cy.contains('h2', 'Instituciones y contexto de trabajo').should('be.visible');
      cy.get('[data-workspace-shell] > div > header').should('not.contain', email).find('[data-cy="logout-button"]').should('not.exist');
      cy.get('aside [data-cy="logout-button"]').should('be.visible');
      cy.get('aside').then($sidebar => {
        const session = $sidebar[0].querySelector('[data-testid="sidebar-session"]');
        expect(session.getBoundingClientRect().bottom).to.be.closeTo(900, 3);
      });
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(1440));
      if (entry.role === 'ADMIN') cy.screenshot('sidebar-admin-perfil', { capture: 'viewport', scale: true });
    });
  });
  [roles[0], roles[2], roles[3]].forEach(entry => {
    it(`perfil heredado sin desbordamiento móvil: ${entry.role}`, () => {
      cy.viewport(375, 900); visitRole(entry);
      cy.get('button[aria-label="Abrir menú"]').click();
      cy.get('[role="dialog"]').contains('a', 'Mi perfil').click();
      cy.contains('h2', 'Instituciones y contexto de trabajo').should('be.visible');
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(375));
    });
  });
  [375, 768, 812].forEach(width => {
    it(`menú, perfil y salida accesibles a ${width}px`, () => {
      cy.viewport(width, width === 812 ? 375 : 900); visitRole(roles[1]);
      cy.get('button[aria-label="Abrir menú"]').click();
      cy.get('[role="dialog"]').should('be.visible').within(() => {
        cy.contains('button', 'Cerrar menú').should('have.focus');
        cy.get('[data-testid="sidebar-session"]').should('contain', email);
        cy.contains('a', 'Mi perfil').click();
      });
      cy.get('[role="dialog"]').should('not.exist');
      cy.location('pathname').should('eq', '/teacher/profile');
      cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(width));
      cy.get('button[aria-label="Abrir menú"]').click();
      cy.get('[role="dialog"] button').first().trigger('keydown', { key: 'Escape' });
      cy.get('[role="dialog"]').should('not.exist');
      cy.get('button[aria-label="Abrir menú"]').should('have.focus').click();
      if (width === 375) cy.screenshot('sidebar-movil', { capture: 'viewport', scale: true });
      cy.get('[role="dialog"]').within(() => { cy.get('[data-cy="logout-button"]').click(); });
      cy.location('pathname').should('eq', '/login');
      cy.window().then(win => expect(win.localStorage.getItem('auth')).to.be.null);
    });
  });
});
