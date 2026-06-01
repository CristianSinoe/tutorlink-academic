describe("TutorLink admin flow", () => {
  it("permite filtrar usuarios y cambiar estado", () => {
    cy.fixture("admin-users").then((users) => {
      cy.intercept("GET", "/api/admin/users", {
        statusCode: 200,
        body: users,
      }).as("getAdminUsers");
    });

    cy.intercept("PATCH", "/api/admin/users/2/status", {
      statusCode: 200,
      body: { ok: true },
    }).as("patchUserStatus");

    cy.visitAsRole("/admin/users", "admin");

    cy.wait("@getAdminUsers");
    cy.contains("Gestión de usuarios").should("be.visible");
    cy.get('[data-cy="admin-users-search"]').type("tutor");
    cy.contains("tutor.e2e@example.test").should("be.visible");
    cy.get('[data-cy="admin-users-role-filter"]').select("TUTOR");
    cy.get('[data-cy="admin-users-status-filter"]').select("ACTIVE");
    cy.get('[data-cy="admin-user-change-status"]').first().click();
    cy.contains("Cambiar estado de usuario").should("be.visible");
    cy.get('[data-cy="admin-status-submit"]').click();
    cy.wait("@patchUserStatus");
    cy.wait("@getAdminUsers");
    cy.contains("Cambiar estado de usuario").should("not.exist");
    cy.contains("tutor.e2e@example.test").should("be.visible");
  });

  it("abre el modal de importación CSV y envía el archivo fixture", () => {
    cy.mockAdminApis();
    cy.visitAsRole("/admin/assignments", "admin");

    cy.wait("@getAssignments");
    cy.contains("Asignaciones Tutor").should("be.visible");
    cy.get('[data-cy="admin-assignments-import-open"]').click();
    cy.contains("Importar asignaciones por CSV").should("be.visible");
    cy.get('input[type="file"]').selectFile("cypress/fixtures/assignments-import.csv", {
      force: true,
    });
    cy.get('[data-cy="admin-assignments-import-submit"]').click();
    cy.wait("@importAssignmentsCsv");
    cy.wait("@getAssignments");
    cy.contains("Importar asignaciones por CSV").should("not.exist");
    cy.contains("Tutor E2E").should("be.visible");
  });
});
