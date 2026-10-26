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
  it('crea, edita, consulta entregas y protege una tarea con historial (contratos simulados)', () => {
    let activities = [];
    cy.intercept('GET', '/api/teacher/courses*', { body: page([{ id: 3, code: 'A', name: 'Grupo A', course_name: 'Matemáticas', period_name: 'Primavera' }]) });
    cy.intercept('GET', '/api/teacher/tasks*', req => req.reply({ body: page(activities) }));
    cy.intercept('POST', '/api/teacher/tasks', req => { expect(req.body.groupId).to.equal(3); activities = [{ ...req.body, id: 21, can_manage: true }]; req.reply({ statusCode: 201, body: { id: 21 } }); }).as('createActivity');
    cy.intercept('PUT', '/api/teacher/tasks/21', req => { expect(req.body).not.to.have.property('groupId'); activities = [{ ...activities[0], ...req.body }]; req.reply({ statusCode: 204 }); }).as('editActivity');
    cy.intercept('GET', '/api/teacher/tasks/21/students*', { body: page([{ student_id: 1, name: 'Ana', matricula: 'S1', status: 'ON_TIME', submission_id: 10, body: 'Respuesta autorizada' }, { student_id: 2, name: 'Juan', matricula: 'S2', status: 'PENDING' }]) });
    cy.intercept('DELETE', '/api/teacher/tasks/21', { statusCode: 409, body: { message: 'La actividad tiene entregas y no puede eliminarse.' } }).as('deleteActivity');
    cy.visitAsRole('/teacher/courses', 'teacher'); cy.contains('button', 'Ver actividades').click();
    cy.contains('button', 'Crear tarea').click(); cy.get('#activity-title').type('Tarea de prueba'); cy.get('#activity-text').type('Instrucciones'); cy.get('#activity-due').type('2027-01-01T12:00'); cy.contains('label', 'Publicada para estudiantes').find('input').check();
    cy.contains('button', 'Guardar actividad').click(); cy.wait('@createActivity');
    cy.contains('h3', 'Tarea de prueba').scrollIntoView().should('be.visible'); cy.get('[aria-label="Editar actividad"]').click();
    cy.get('#activity-title').clear().type('Tarea editada'); cy.contains('button', 'Guardar actividad').click(); cy.wait('@editActivity');
    cy.contains('h3', 'Tarea editada').scrollIntoView().should('be.visible'); cy.contains('button', 'Ver entregas').click();
    cy.contains('td', 'Ana').scrollIntoView().should('be.visible'); cy.contains('span', 'Pendiente').should('be.visible'); cy.contains('summary', 'Ver entrega').click(); cy.contains('Respuesta autorizada').should('be.visible');
    cy.contains('button', 'Volver a actividades').click(); cy.get('[aria-label="Eliminar actividad"]').click();
    cy.contains('button', 'Cancelar eliminación').click(); cy.contains('h3', 'Tarea editada').scrollIntoView().should('be.visible');
    cy.get('[aria-label="Eliminar actividad"]').click(); cy.contains('button', 'Confirmar eliminación').click(); cy.wait('@deleteActivity');
    cy.contains('La actividad tiene entregas y no puede eliminarse.').should('be.visible'); cy.contains('h3', 'Tarea editada').scrollIntoView().should('be.visible');
  });
  it('muestra Mis materias para DOCENTE y ESTUDIANTE sin enlaces futuros', () => {
    cy.intercept('GET', '/api/teacher/courses*', { body: page([{ id: 3, code: 'A', name: 'Grupo A', course_name: 'Matemáticas', period_name: 'Primavera' }]) });
    cy.visitAsRole('/teacher/courses', 'teacher'); cy.get('main').find('h1').should('have.text', 'Mis materias'); cy.contains('Matemáticas').should('be.visible'); cy.contains(/tareas|asistencia|materiales/i).should('not.exist');
    cy.intercept('GET', '/api/student/courses*', { body: page([]) }); cy.visitAsRole('/student/courses', 'student'); cy.contains('No tienes materias activas.').should('be.visible');
  });
  [375, 1366].forEach(width => {
    it(`consulta actividades reales del contrato docente en el shell compartido a ${width}px (respuestas simuladas)`, () => {
      cy.viewport(width, 768);
      cy.intercept('GET', '/api/teacher/courses*', { body: page([{ id: 3, code: 'A', name: 'Grupo A', course_name: 'Matemáticas', period_name: 'Primavera' }]) });
      cy.intercept('GET', '/api/teacher/tasks*', { body: page([{ id: 12, title: 'Ejercicio de álgebra', instructions: 'Resolver los problemas indicados.', published: true, due_at: '2026-12-01T12:00:00Z', allow_late_submissions: false }]) }).as('tasks');
      cy.intercept('GET', '/api/teacher/contents*', { body: page([{ id: 13, title: 'Lectura de apoyo', body: 'Material de la clase.', published: false }]) }).as('contents');
      cy.visitAsRole('/teacher/courses', 'teacher');
      cy.get('[data-workspace-shell]').should('have.class', 'tl-admin-shell');
      cy.contains('button', 'Ver actividades').click();
      cy.wait('@tasks').its('request.query').should('include', { groupId: '3', size: '5' });
      cy.get('[role=dialog]').should('have.class', 'tl-dialog-admin').and('contain', 'Ejercicio de álgebra').and('contain', 'Publicado');
      cy.contains('button', 'Clases y materiales').click();
      cy.wait('@contents').its('request.query').should('include', { groupId: '3' });
      cy.get('[role=dialog]').should('contain', 'Lectura de apoyo').and('contain', 'Borrador').and('not.contain', 'Ejercicio de álgebra');
      cy.get('[role=dialog]').then(dialog => {
        const bounds = dialog[0].getBoundingClientRect();
        expect(bounds.right).to.be.at.most(width);
        expect(bounds.left).to.be.at.least(0);
      });
      cy.screenshot(`teacher-activities-${width}`, { capture: 'viewport' });
      cy.get('[role=dialog]').find('button').contains(/^Cerrar$/).click();
      cy.get('[role=dialog]').should('not.exist');
      cy.contains('button', 'Ver actividades').should('have.focus');
    });
  });
  it('elimina un material propio sin entregas ni referencias (contratos simulados)', () => {
    let materials = [{ id: 22, title: 'Material sin dependencias', body: 'Lectura', published: false, can_manage: true }];
    cy.intercept('GET', '/api/teacher/courses*', { body: page([{ id: 3, code: 'A', name: 'Grupo A', course_name: 'Matemáticas', period_name: 'Primavera' }]) });
    cy.intercept('GET', '/api/teacher/tasks*', { body: page([]) });
    cy.intercept('GET', '/api/teacher/contents*', req => req.reply({ body: page(materials) }));
    cy.intercept('DELETE', '/api/teacher/contents/22', req => { materials = []; req.reply({ statusCode: 204 }); }).as('removeMaterial');
    cy.visitAsRole('/teacher/courses', 'teacher'); cy.contains('button', 'Ver actividades').click(); cy.contains('button', 'Clases y materiales').click();
    cy.get('[aria-label="Eliminar actividad"]').click(); cy.contains('button', 'Confirmar eliminación').click(); cy.wait('@removeMaterial');
    cy.contains('Actividad eliminada.').should('be.visible'); cy.contains('Este grupo no tiene clases o materiales disponibles.').scrollIntoView().should('be.visible');
  });
});
