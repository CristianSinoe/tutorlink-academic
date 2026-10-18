describe("TutorLink access control", () => {
  it("redirige a login cuando no hay sesión", () => {
    cy.visit("/student/questions");
    cy.location("pathname").should("eq", "/login");
    cy.location("search").should("include", "next=%2Fstudent%2Fquestions");
  });

  it("bloquea a estudiante en rutas admin", () => {
    cy.visitAsRole("/admin/users", "student");
    cy.location("pathname").should("eq", "/access-denied");
  });

  it("bloquea a tutor en rutas admin", () => {
    cy.visitAsRole("/admin/users", "tutor");
    cy.location("pathname").should("eq", "/access-denied");
  });

  it("permite a admin entrar a rutas admin", () => {
    cy.mockAdminApis();
    cy.visitAsRole("/admin/users", "admin");
    cy.wait("@getInstitutionalUsers");
    cy.location("pathname").should("eq", "/admin/users");
    cy.contains("Gestión de usuarios institucionales").should("be.visible");
  });
});
