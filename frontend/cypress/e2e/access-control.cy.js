describe("TutorLink access control", () => {
  it("redirige a login cuando no hay sesión", () => {
    cy.visit("/student/questions");
    cy.location("pathname").should("eq", "/login");
    cy.location("search").should("include", "next=%2Fstudent%2Fquestions");
  });

  it("bloquea a estudiante en rutas admin", () => {
    cy.visitAsRole("/admin/users", "student");
    cy.location("pathname").should("eq", "/login");
  });

  it("bloquea a tutor en rutas admin", () => {
    cy.visitAsRole("/admin/users", "tutor");
    cy.location("pathname").should("eq", "/login");
  });

  it("permite a admin entrar a rutas admin", () => {
    cy.fixture("admin-users").then((users) => {
      cy.intercept("GET", "/api/admin/users", {
        statusCode: 200,
        body: users,
      }).as("getAdminUsers");
    });

    cy.visitAsRole("/admin/users", "admin");
    cy.wait("@getAdminUsers");
    cy.location("pathname").should("eq", "/admin/users");
    cy.contains("Gestión de usuarios").should("be.visible");
  });
});
