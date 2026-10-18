// Real React -> Spring Boot -> PostgreSQL coverage. No business endpoint is intercepted.
const enabled = Cypress.env('REAL_E2E') === true || Cypress.env('REAL_E2E') === 'true';
const describeReal = enabled ? describe : describe.skip;
const api = 'http://127.0.0.1:8080';
const password = 'TutorLinkDemo2026!';

function realLogin(email, institutionId, selectedRole) {
  return cy.request('POST', `${api}/api/auth/login`, { email, password, recaptchaToken: Cypress.env('E2E_RECAPTCHA_TOKEN') })
    .then(({ body }) => cy.task('e2eOtp', { email, otpToken: body.otpToken }).then(code => ({ challenge: body, code })))
    .then(({ challenge, code }) => {
      const option = institutionId ? challenge.institutions.find(item => item.institutionId === institutionId) : challenge.institutions[0];
      expect(option, 'institución autorizada').to.exist;
      return cy.request('POST', `${api}/api/auth/login/verify-otp`, { otpToken: challenge.otpToken, code, institutionId: option.institutionId });
    })
    .then(({ body }) => ({ version: 2, ...body, selectedRole: selectedRole || body.roles[0] }));
}
const headers = session => ({ Authorization: `Bearer ${session.token}` });
const visitAs = (path, session) => cy.visit(path, { onBeforeLoad(win) { win.localStorage.setItem('auth', JSON.stringify(session)); } });

describeReal('Fase 2B.4 — módulo académico real', () => {
  it('crea catálogos, relaciona perfiles, valida ambos espacios y conserva aislamiento', () => {
    const suffix = Date.now(); const periodCode = `E2E-P-${suffix}`; const courseCode = `E2E-C-${suffix}`; const groupCode = `E2E-G-${suffix}`;
    let admin; let institutionId; let periodId; let courseId; let groupId; let teacher; let student;
    realLogin('admin1.demo15@example.invalid', undefined, 'ADMIN').then(session => {
      admin = session; institutionId = session.institutionId;
      visitAs('/admin/periods', admin); cy.contains('Crear periodo').click(); cy.get('#periods-code').type(periodCode); cy.get('#periods-name').type(`Periodo ${suffix}`); cy.get('#period-start').type('2027-01-01'); cy.get('#period-end').type('2027-06-30'); cy.get('[role=dialog]').contains('button', 'Crear').click(); cy.contains(periodCode).should('be.visible');
      cy.request({ url: `${api}/api/admin/academic/periods?q=${periodCode}`, headers: headers(admin) }).then(({ body }) => { periodId = body.content[0].id; });
    }).then(() => {
      visitAs('/admin/courses', admin); cy.contains('Crear curso').click(); cy.get('#courses-code').type(courseCode); cy.get('#courses-name').type(`Materia ${suffix}`); cy.get('#course-description').type('Materia sintética E2E'); cy.get('[role=dialog]').contains('button', 'Crear').click(); cy.contains(courseCode).should('be.visible');
      cy.request({ url: `${api}/api/admin/academic/courses?q=${courseCode}`, headers: headers(admin) }).then(({ body }) => { courseId = body.content[0].id; });
    }).then(() => {
      visitAs('/admin/groups', admin); cy.contains('Crear grupo').click(); cy.get('#group-course').select(String(courseId)); cy.get('#group-period').select(String(periodId)); cy.get('#group-code').type(groupCode); cy.get('#group-name').type(`Grupo ${suffix}`); cy.get('[role=dialog]').contains('button', 'Crear grupo').click(); cy.contains(groupCode).should('be.visible');
      cy.request({ url: `${api}/api/admin/academic/groups?q=${groupCode}`, headers: headers(admin) }).then(({ body }) => { groupId = body.content[0].id; });
      cy.request({ url: `${api}/api/admin/institution/users?role=DOCENTE&membershipStatus=ACTIVE&status=ACTIVE&page=0&size=100`, headers: headers(admin) }).then(({ body }) => { teacher = body.items.find(item => item.profiles?.DOCENTE); expect(teacher).to.exist; });
      cy.request({ url: `${api}/api/admin/institution/users?role=ESTUDIANTE&membershipStatus=ACTIVE&status=ACTIVE&page=0&size=100`, headers: headers(admin) }).then(({ body }) => { student = body.items.find(item => item.profiles?.ESTUDIANTE); expect(student).to.exist; });
    }).then(() => {
      visitAs('/admin/groups', admin); cy.get('#groups-search').type(groupCode); cy.contains('tr', groupCode).within(() => cy.contains('Gestionar').click());
      cy.get('#assign-teacher').select(String(teacher.profiles.DOCENTE)); cy.contains('button', 'Asignar').click(); cy.contains('[role="region"][aria-label="Docentes asignados"] tbody tr', teacher.name).should('be.visible');
      cy.get('#enroll-student').select(String(student.profiles.ESTUDIANTE)); cy.contains('button', 'Inscribir o reactivar').click(); cy.contains('[role="region"][aria-label="Inscripciones del grupo"] tbody tr', student.name).should('be.visible');
      cy.request({ url: `${api}/api/admin/academic/groups/${groupId}/teachers`, headers: headers(admin) }).its('body.content').then(rows => expect(rows.some(row => row.teacherId === teacher.profiles.DOCENTE)).to.equal(true));
      cy.request({ url: `${api}/api/admin/academic/groups/${groupId}/enrollments?status=ACTIVE`, headers: headers(admin) }).its('body.content').then(rows => expect(rows.some(row => row.studentId === student.profiles.ESTUDIANTE)).to.equal(true));
      cy.request({ method: 'POST', url: `${api}/api/admin/academic/groups/${groupId}/teachers`, headers: headers(admin), body: { teacherId: teacher.profiles.DOCENTE }, failOnStatusCode: false }).its('status').should('eq', 409);
    }).then(() => realLogin(teacher.email, institutionId, 'DOCENTE')).then(teacherSession => {
      visitAs('/teacher/courses', teacherSession); cy.contains(`Materia ${suffix}`).should('be.visible');
    }).then(() => realLogin(student.email, institutionId, 'ESTUDIANTE')).then(studentSession => {
      visitAs('/student/courses', studentSession); cy.contains(`Materia ${suffix}`).should('be.visible');
      cy.request({ method: 'DELETE', url: `${api}/api/admin/academic/groups/${groupId}/enrollments/${student.profiles.ESTUDIANTE}`, headers: headers(admin) }).its('status').should('eq', 204);
      cy.request({ url: `${api}/api/admin/academic/groups/${groupId}/enrollments?status=WITHDRAWN`, headers: headers(admin) }).its('body.content').then(rows => expect(rows.some(row => row.studentId === student.profiles.ESTUDIANTE)).to.equal(true));
      visitAs('/student/courses', studentSession); cy.contains(`Materia ${suffix}`).should('not.exist');
    }).then(() => realLogin('admin2.demo15@example.invalid', undefined, 'ADMIN')).then(adminB => {
      expect(adminB.institutionId).not.to.equal(institutionId);
      cy.request({ method: 'GET', url: `${api}/api/admin/academic/groups/${groupId}/teachers`, headers: headers(adminB), failOnStatusCode: false }).its('status').should('eq', 403);
      cy.request({ method: 'POST', url: `${api}/api/admin/academic/groups/${groupId}/enrollments`, headers: headers(adminB), body: { studentId: student.profiles.ESTUDIANTE }, failOnStatusCode: false }).its('status').should('eq', 403);
    });
  });
});
