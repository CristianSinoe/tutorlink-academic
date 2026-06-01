describe("TutorLink auth", () => {
  it("muestra error con credenciales inválidas", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 401,
      body: { message: "Credenciales inválidas." },
    }).as("invalidLogin");

    cy.visit("/login");
    cy.contains("Inicia sesión en TutorLink", { timeout: 10000 }).should("be.visible");
    cy.get('[data-cy="login-recaptcha-bypassed"]').should("be.visible");
    cy.get('[data-cy="login-email"]').type("wrong@example.test");
    cy.get('[data-cy="login-password"]').type("bad-password");
    cy.get('[data-cy="login-submit"]').click();

    cy.wait("@invalidLogin");
    cy.contains("Credenciales inválidas.").should("be.visible");
  });

  it("completa login visual con OTP mockeado y permite cerrar sesión", () => {
    cy.loginViaUiAs("student");

    cy.location("pathname").should("eq", "/student");
    cy.contains("Dashboard del estudiante").should("be.visible");
    cy.get('[data-cy="logout-button"]').filter(":visible").first().click();
    cy.location("pathname").should("eq", "/login");
  });
});
