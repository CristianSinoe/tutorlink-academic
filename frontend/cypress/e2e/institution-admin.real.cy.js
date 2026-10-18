// Requires the isolated `demo,e2e` Spring process. This file never intercepts HTTP.
const enabled = Cypress.env("REAL_E2E") === true || Cypress.env("REAL_E2E") === "true";
const describeReal = enabled ? describe : describe.skip;
const password = "TutorLinkDemo2026!";

function realLogin(email = "admin1.demo15@example.invalid") {
  return cy.request("POST", "http://127.0.0.1:8080/api/auth/login", { email, password, recaptchaToken: Cypress.env("E2E_RECAPTCHA_TOKEN") })
    .then(({ body }) => cy.task("e2eOtp", { email, otpToken: body.otpToken }).then(code => ({ challenge: body, code })))
    .then(({ challenge, code }) => cy.request("POST", "http://127.0.0.1:8080/api/auth/login/verify-otp", { otpToken: challenge.otpToken, code, institutionId: challenge.institutions[0].institutionId }))
    .then(({ body }) => ({ session: { version: 2, ...body, selectedRole: body.roles[0] }, institution: body.institutionId }));
}

describeReal("Administración institucional V30 — API y React reales", () => {
  let auth; let studentId;
  before(() => {
    cy.request({ method: "GET", url: "http://127.0.0.1:8080/api/auth/institutions", failOnStatusCode: false }).its("status").should("be.oneOf", [401, 403]);
    realLogin().then(value => { auth = value; });
  });
  beforeEach(() => {
    cy.visit("/admin/users", { onBeforeLoad(win) { win.localStorage.setItem("auth", JSON.stringify(auth.session)); } });
  });

  it("lista únicamente usuarios de la institución contextual y permite editar perfiles locales", () => {
    cy.contains("Gestión de usuarios institucionales").should("be.visible");
    cy.get('#institution-users-role').select('ESTUDIANTE');
    cy.get('tbody tr').first().should("contain", "Estudiante Demo").within(() => cy.contains("Ver detalle").click());
    cy.contains("Cuenta global").should("be.visible");
    cy.contains("button", "ESTUDIANTE").click();
    cy.get('#edit-ESTUDIANTE-phone').clear().type("5550001001");
    cy.contains("Guardar perfil local").click();
    cy.get('#edit-ESTUDIANTE-phone').should('have.value', '5550001001');
    cy.request({ url: `http://127.0.0.1:8080/api/admin/institution/users?role=ESTUDIANTE&page=0&size=1`, headers: { Authorization: `Bearer ${auth.session.token}` } })
      .then(({ body }) => { studentId = body.items[0].userId; });
  });

  it("edita perfiles DOCENTE y TUTOR, conserva roles múltiples y cambia solo la membresía seleccionada", () => {
    cy.get('#institution-users-role').select('DOCENTE');
    cy.get('tbody tr').first().within(() => cy.contains('Ver detalle').click());
    cy.contains('button', 'DOCENTE').click(); cy.get('#edit-DOCENTE-phone').clear().type('5550002001'); cy.contains('Guardar perfil local').click();
    cy.get('#edit-DOCENTE-phone').should('have.value', '5550002001');
    cy.contains('button', 'TUTOR').click(); cy.get('#edit-TUTOR-phone').clear().type('5550003001'); cy.contains('Guardar perfil local').click();
    cy.get('#edit-TUTOR-phone').should('have.value', '5550003001');
    cy.contains('Suspender').first().click(); cy.contains('Confirmar').click(); cy.contains('Reactivar').should('be.visible');
    cy.contains('Reactivar').click(); cy.contains('Confirmar').click(); cy.contains('Reactivar').should('not.exist');
  });

  it("rechaza desde otra institución el detalle y modificación de un usuario de A", () => {
    cy.then(() => realLogin('admin2.demo15@example.invalid')).then(other => {
      cy.request({ method: 'GET', url: `http://127.0.0.1:8080/api/admin/institution/users/${studentId}`, headers: { Authorization: `Bearer ${other.session.token}` }, failOnStatusCode: false }).its('status').should('eq', 403);
      cy.request({ method: 'PUT', url: `http://127.0.0.1:8080/api/admin/institution/users/${studentId}/profiles/ESTUDIANTE`, headers: { Authorization: `Bearer ${other.session.token}` }, body: { code: 'NO', career: 'X' }, failOnStatusCode: false }).its('status').should('eq', 403);
    });
  });

  it("crea, lista, reenvía y cancela una invitación sin mostrar su prueba", () => {
    const email = `e2e-${Date.now()}@example.invalid`;
    cy.visit("/admin/invitations", { onBeforeLoad(win) { win.localStorage.setItem("auth", JSON.stringify(auth.session)); } });
    cy.contains("Crear invitación").click();
    cy.get('#invite-contact').type(email); cy.get('#invite-code').type(`E2E-${Date.now()}`);
    cy.contains("Emitir invitación").click();
    cy.contains(email).should("be.visible");
    cy.contains(/token/i).should("not.exist");
    cy.contains('tr', email).within(() => cy.contains("Reenviar").click());
    cy.get('[role="dialog"]').contains("Confirmar").click();
    cy.contains('tr', email).within(() => cy.contains("Cancelar").click());
    cy.get('[role="dialog"]').contains("Confirmar").click();
  });

  it("importa CSV parcialmente válido y confirma el reporte real", () => {
    const suffix = Date.now();
    const csv = [
      'name,lastNamePaterno,email,code,career,plan,semester',
      `Importado${suffix},Prueba,csv-${suffix}@example.invalid,MAT-${suffix},ISC,2026,2`,
      `Inválido,Prueba,invalido-${suffix},MAT-BAD,ISC,2026,2`,
      `Repetido,Prueba,csv-${suffix}@example.invalid,MAT-${suffix},ISC,2026,2`,
    ].join('\n');
    cy.visit('/admin/students', { onBeforeLoad(win) { win.localStorage.setItem('auth', JSON.stringify(auth.session)); } });
    cy.contains('Importar estudiantes').click();
    cy.get('input[type=file]').selectFile({ contents: Cypress.Buffer.from(csv), fileName: 'students.csv', mimeType: 'text/csv' }, { force: true });
    cy.contains('Procesar importación').click();
    cy.contains('Importación procesada.').should('be.visible');
    cy.contains('INVITED').should('be.visible'); cy.contains('FAILED').should('be.visible'); cy.contains('SKIPPED').should('be.visible');
  });

  it("importa XLSX real y verifica la invitación persistida en la institución activa", () => {
    const suffix = Date.now(); const email = `xlsx-${suffix}@example.invalid`;
    cy.visit('/admin/students', { onBeforeLoad(win) { win.localStorage.setItem('auth', JSON.stringify(auth.session)); } });
    cy.contains('Importar estudiantes').click();
    cy.task('e2eXlsx', { suffix }).then(file => {
      cy.get('input[type=file]').selectFile(file, { force: true });
      cy.contains('Procesar importación').click();
      cy.contains('Importación procesada.').should('be.visible'); cy.contains('INVITED').should('be.visible');
      cy.task('removeE2eFile', file);
    });
    cy.request({ url: `http://127.0.0.1:8080/api/admin/institution/users/invitations?page=0&size=100`, headers: { Authorization: `Bearer ${auth.session.token}` } })
      .its('body.content').then(rows => expect(rows.some(row => row.contactEmail === email)).to.equal(true));
  });

  it("detecta una cuenta duplicada sin duplicar su membresía institucional", () => {
    cy.request({ url: 'http://127.0.0.1:8080/api/admin/institution/users?role=ESTUDIANTE&membershipStatus=ACTIVE&page=0&size=100', headers: { Authorization: `Bearer ${auth.session.token}` } })
      .then(({ body }) => {
        const existing = body.items.find(item => item.roles.length === 1);
        expect(existing).to.exist;
        const csv = ['name,lastNamePaterno,email,code,career,plan,semester', `Duplicado,Prueba,${existing.email},DUP-${Date.now()},ISC,2026,2`].join('\n');
        cy.visit('/admin/students', { onBeforeLoad(win) { win.localStorage.setItem('auth', JSON.stringify(auth.session)); } });
        cy.contains('Importar estudiantes').click();
        cy.get('input[type=file]').selectFile({ contents: Cypress.Buffer.from(csv), fileName: 'duplicate.csv', mimeType: 'text/csv' }, { force: true });
        cy.contains('Procesar importación').click(); cy.contains('SKIPPED').should('be.visible');
        cy.request({ url: 'http://127.0.0.1:8080/api/admin/institution/users?role=ESTUDIANTE&membershipStatus=ACTIVE&page=0&size=100', headers: { Authorization: `Bearer ${auth.session.token}` } })
          .its('body.items').then(items => expect(items.filter(item => item.email === existing.email)).to.have.length(1));
      });
  });

  it("asigna DOCENTE y TUTOR, los conserva y revoca solamente DOCENTE", () => {
    cy.request({ url: 'http://127.0.0.1:8080/api/admin/institution/users?membershipStatus=ACTIVE&page=0&size=100', headers: { Authorization: `Bearer ${auth.session.token}` } })
      .then(({ body }) => {
        const target = body.items.find(item => item.roles.length === 1 && item.roles[0] === 'TUTOR');
        expect(target).to.exist;
        cy.visit('/admin/tutors', { onBeforeLoad(win) { win.localStorage.setItem('auth', JSON.stringify(auth.session)); } });
        cy.get('#institution-users-search').type(target.email); cy.contains('tr', target.email).within(() => cy.contains('Ver detalle').click());
        cy.get('[aria-label="Rol para agregar"]').select('DOCENTE'); cy.get('#add-DOCENTE-code').type(`DOC-${Date.now()}`); cy.get('#add-DOCENTE-department').type('Área E2E'); cy.get('button').contains(/^Agregar rol$/).click();
        cy.contains('span', 'DOCENTE').should('be.visible');
        cy.contains('button', 'DOCENTE').scrollIntoView().should('be.visible'); cy.contains('button', 'TUTOR').scrollIntoView().should('be.visible');
        cy.request({ url: `http://127.0.0.1:8080/api/admin/institution/users/${target.userId}`, headers: { Authorization: `Bearer ${auth.session.token}` } }).then(({ body: detail }) => {
          expect(detail.memberships.filter(item => item.status === 'ACTIVE').map(item => item.role)).to.include.members(['DOCENTE', 'TUTOR']);
          expect(detail.profiles.map(item => item.role)).to.include.members(['DOCENTE', 'TUTOR']);
        });
        cy.get('[role="dialog"]').contains('span', 'DOCENTE').parent().within(() => cy.contains('Revocar').click()); cy.contains('Confirmar').click(); cy.contains('Revocado').should('be.visible');
        cy.request({ url: `http://127.0.0.1:8080/api/admin/institution/users/${target.userId}`, headers: { Authorization: `Bearer ${auth.session.token}` } }).then(({ body: detail }) => {
          expect(detail.memberships.find(item => item.role === 'DOCENTE').status).to.equal('REVOKED');
          expect(detail.memberships.find(item => item.role === 'TUTOR').status).to.equal('ACTIVE');
          expect(detail.status).to.equal(target.status);
        });
      });
  });

  it("cambia de institución A a B desde Mi perfil y el backend rechaza un usuario de A", () => {
    cy.request({ url: 'http://127.0.0.1:8080/api/auth/institutions', headers: { Authorization: `Bearer ${auth.session.token}` } }).then(({ body: options }) => {
      expect(options).to.have.length.at.least(2); const to = options.find(item => item.institutionId !== auth.institution); expect(to).to.exist;
      cy.request({ url: 'http://127.0.0.1:8080/api/admin/institution/users?role=ESTUDIANTE&page=0&size=100', headers: { Authorization: `Bearer ${auth.session.token}` } }).then(({ body }) => {
        const resourceFromA = body.items.at(-1).userId;
        cy.visit('/admin/profile', { onBeforeLoad(win) { win.localStorage.setItem('auth', JSON.stringify(auth.session)); } });
        cy.get('#active-institution').select(String(to.institutionId)); cy.get('[role="dialog"]').contains('Continuar').click(); cy.location('pathname').should('eq', '/admin'); cy.get('main').contains(to.name).should('be.visible');
        cy.window().then(win => {
          const sessionB = JSON.parse(win.localStorage.getItem('auth')); expect(sessionB.institutionId).to.equal(to.institutionId);
          cy.request({ method: 'GET', url: `http://127.0.0.1:8080/api/admin/institution/users/${resourceFromA}`, headers: { Authorization: `Bearer ${sessionB.token}` }, failOnStatusCode: false }).its('status').should('eq', 403);
        });
      });
    });
  });

});
