// Browser tests with simulated HTTP responses; these do not assert real backend authorization.
const actor = { email: 'persona@example.test', name: 'Persona', role: 'TUTOR' };
const schools = [{ institutionId: 1, name: 'Escuela A', roles: ['DOCENTE', 'TUTOR'] }, { institutionId: 2, name: 'Escuela B', roles: ['ESTUDIANTE'] }];
function contextual(id = 1, roles = schools.find(s => s.institutionId === id).roles) {
  return { ...actor, token: `context-${id}`, institutionId: id, roles };
}
function contextApis() {
  ['/api/teacher/courses*', '/api/teacher/tasks*', '/api/teacher/questions*'].forEach(url => cy.intercept('GET', url, { body: { content: [], page: 0, size: 1, totalElements: 0, totalPages: 0 } }));
  cy.intercept('GET', '/api/auth/institutions', { body: schools });
  cy.intercept('POST', '/api/auth/context', req => req.reply({ body: contextual(req.body.institutionId) })).as('context');
}
function seed(win, session, selectedRole) { win.localStorage.setItem('auth', JSON.stringify({ version: 2, ...session, selectedRole })); }

describe('Contexto V30 y roles múltiples', () => {
  beforeEach(() => cy.viewport(1280, 800));
  it('login selecciona escuela antes de OTP y reúne DOCENTE/TUTOR sin cambiar JWT', () => {
    contextApis(); cy.mockRecaptcha(); cy.mockTutorApis();
    cy.intercept('POST', '/api/auth/login', { body: { requiresOtp: true, otpToken: 'proof', institutions: schools, resendCooldownSeconds: 1 } }).as('login');
    cy.intercept('POST', '/api/auth/login/verify-otp', req => { expect(req.body.institutionId).to.equal(1); req.reply({ body: contextual() }); }).as('otp');
    cy.intercept('GET', '/api/tutor/dashboard/summary', { body: { pendingCount: 0, todayAnsweredCount: 0, totalAnswers: 0 } });
    cy.intercept('GET', '/api/tutor/questions/recent*', { body: [] });
    cy.visit('/login'); cy.get('[data-cy="login-email"]').type(actor.email); cy.get('[data-cy="login-password"]').type('secret123');
    cy.get('[data-cy="mock-recaptcha-button"]').click(); cy.get('[data-cy="login-submit"]').click(); cy.wait('@login');
    cy.get('#otp-code').type('123456'); cy.get('[data-cy="otp-submit"]').click(); cy.get('[role="alert"]').should('contain', 'Selecciona una institución');
    cy.get('#otp-institution').select('1'); cy.get('[data-cy="otp-submit"]').click(); cy.wait('@otp');
    cy.location('pathname').should('eq', '/teacher');
    cy.contains('h1', 'Resumen de docencia y tutorías').should('be.visible');
    cy.screenshot('resumen-docencia-tutorias', { capture: 'viewport', scale: true });
    cy.get('aside').contains('a', 'Preguntas pendientes').click();
    cy.location('pathname').should('eq', '/tutor/pending');
    cy.get('aside').contains('a', 'Mis materias y actividades').should('be.visible');
    cy.get('aside').contains('a', 'Mi perfil').click();
    cy.get('#active-role').should('not.exist');
    cy.contains('Docencia y tutorías están disponibles juntas').should('be.visible');
    cy.window().then(win => { const auth = JSON.parse(win.localStorage.getItem('auth')); expect(auth.token).to.equal('context-1'); expect(auth.roles).to.deep.equal(['DOCENTE', 'TUTOR']); });
    cy.screenshot('docencia-tutorias-contexto');
  });
  it('cambia institución con confirmación y datos del nuevo contexto en móvil', () => {
    contextApis(); cy.mockStudentApis(); cy.intercept('GET', '/api/me', { body: { id: 1, ...actor } }); cy.viewport(375, 812);
    cy.visit('/teacher', { onBeforeLoad: win => seed(win, contextual(), 'DOCENTE') }); cy.wait('@context');
    cy.get('button[aria-label="Abrir menú"]').click(); cy.get('[role="dialog"]').contains('a', 'Mi perfil').click(); cy.get('#active-institution').select('2'); cy.get('[role="dialog"]').should('contain', 'formularios no guardados');
    cy.get('[role="dialog"]').contains('Continuar').click(); cy.wait('@context');
    cy.location('pathname').should('eq', '/student'); cy.contains('Dashboard del estudiante').should('be.visible'); cy.get('button[aria-label="Abrir menú"]').click(); cy.get('[role="dialog"]').should('contain', 'Escuela B'); cy.contains('button', 'Cerrar menú').click();
    cy.window().then(win => { const auth = JSON.parse(win.localStorage.getItem('auth')); expect(auth.institutionId).to.equal(2); expect(auth.roles).to.deep.equal(['ESTUDIANTE']); });
    cy.document().then(doc => expect(doc.documentElement.scrollWidth).to.be.at.most(375)); cy.screenshot('phase2b-contexto-movil');
  });
  it('fallo de cambio mantiene la escuela anterior y recuperación visible', () => {
    contextApis();
    cy.visit('/teacher', { onBeforeLoad: win => seed(win, contextual(), 'DOCENTE') }); cy.wait('@context');
    cy.intercept('POST', '/api/auth/context', { statusCode: 403, body: { message: 'Contexto no autorizado' } });
    cy.contains('a', 'Mi perfil').click(); cy.get('#active-institution').select('2'); cy.get('[role="dialog"]').contains('Continuar').click();
    cy.contains('Tu contexto anterior se conserva').should('be.visible'); cy.contains('Escuela A').should('be.visible'); cy.location('pathname').should('eq', '/tutor/profile');
  });
  it('SUPER_ADMIN lista instituciones, entra a una escuela y vuelve mediante reautenticación', () => {
    const global = { ...actor, role: 'SUPER_ADMIN', token: 'global', institutionId: null, roles: ['PLATFORM_SUPER_ADMIN'] };
    cy.intercept('GET', '/api/platform/institutions', { body: [{ id: 1, name: 'Escuela A', status: 'ACTIVE' }, { id: 2, name: 'Escuela cerrada', status: 'INACTIVE' }] });
    cy.intercept('POST', '/api/auth/context', { body: { ...global, token: 'scoped', institutionId: 1, roles: ['SUPER_ADMIN'] } }).as('context');
    cy.intercept('GET', '/api/auth/institutions', { body: [] });
    cy.visit('/platform', { onBeforeLoad: win => seed(win, global, 'PLATFORM_SUPER_ADMIN') });
    cy.contains('Institución inactiva').should('be.visible'); cy.contains('Entrar a Escuela A').click(); cy.get('[role="dialog"]').contains('Continuar').click(); cy.wait('@context');
    cy.location('pathname').should('eq', '/context'); cy.contains('a', 'Mi perfil').click(); cy.contains('Volver a plataforma').click(); cy.get('[role="dialog"]').should('contain', 'contraseña y código');
    cy.get('[role="dialog"]').contains('Continuar').click(); cy.location('search').should('eq', '?access=platform');
    cy.window().then(win => expect(win.localStorage.getItem('auth')).to.be.null);
  });
  it('acepta invitación sin conservar prueba en URL ni iniciar sesión automáticamente', () => {
    const token = 'a'.repeat(43);
    cy.intercept('POST', '/api/institution-invitations/accept', req => { expect(req.body).to.deep.equal({ token, password: 'secret123' }); req.reply({ body: { userId: 8, roles: ['TUTOR'] } }); }).as('accept');
    cy.visit(`/accept-institution-invitation?token=${token}`);
    cy.location('search').should('eq', ''); cy.get('#invite-password').type('secret123', { log: false });
    cy.contains('button', 'Aceptar invitación').click(); cy.wait('@accept'); cy.contains('Invitación aceptada').should('be.visible');
    cy.window().then(win => expect(win.localStorage.getItem('auth')).to.be.null);
  });
});
