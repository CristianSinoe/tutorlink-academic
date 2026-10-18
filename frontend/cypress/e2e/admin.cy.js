describe("TutorLink institutional administration V30", () => {
  beforeEach(() => cy.mockAdminApis());

  it("lists V30 users and confirms a local membership suspension", () => {
    cy.visitAsRole("/admin/users", "admin");
    cy.wait("@getInstitutionalUsers");
    cy.contains("Gestión de usuarios institucionales").should("be.visible");
    cy.contains("tutor.e2e@example.test").should("be.visible");
    cy.contains("Ver detalle").first().click();
    cy.wait("@getInstitutionalUser");
    cy.contains("Cuenta global").should("be.visible");
    cy.contains("Suspender").click();
    cy.contains("Confirmar").click();
    cy.wait("@patchInstitutionalMembership");
  });

  it("imports an institutional CSV and displays its report", () => {
    cy.visitAsRole("/admin/students", "admin");
    cy.wait("@getInstitutionalUsers");
    cy.contains("Importar estudiantes").click();
    cy.get('input[type="file"]').selectFile({ contents: Cypress.Buffer.from("name,email\\nAna,ana@example.test"), fileName: "students.csv", mimeType: "text/csv" }, { force: true });
    cy.contains("Procesar importación").click();
    cy.wait("@importInstitutionalCsv");
    cy.contains("Importación procesada.").should("be.visible");
  });

  it("creates and cancels invitations without exposing an acceptance proof", () => {
    cy.visitAsRole("/admin/invitations", "admin");
    cy.wait("@getInstitutionalInvitations");
    cy.contains("invite@example.test").should("be.visible");
    cy.contains("Crear invitación").click();
    cy.get('#invite-contact').type("new@example.test");
    cy.get('#invite-code').type("A-1");
    cy.contains("Emitir invitación").click();
    cy.wait("@createInstitutionalInvitation");
    cy.contains("Cancelar").first().click();
    cy.contains("Confirmar").click();
    cy.wait("@cancelInstitutionalInvitation");
    cy.contains(/token/i).should("not.exist");
  });

  it("keeps the legacy assignments module separate", () => {
    cy.visitAsRole("/admin/assignments", "admin");
    cy.wait("@getAssignments");
    cy.contains("Asignaciones Tutor").should("be.visible");
  });
});
