describe("TutorLink tutor flow", () => {
  it("permite abrir una pregunta pendiente y responderla", () => {
    let detailRequestCount = 0;

    cy.fixture("tutor-pending").then((fixture) => {
      cy.intercept("GET", "/api/tutor/questions/pending/my*", {
        statusCode: 200,
        body: fixture.list,
      }).as("getTutorPending");

      cy.intercept("GET", "/api/questions/201/messages", (req) => {
        detailRequestCount += 1;
        req.reply({
          statusCode: 200,
          body: detailRequestCount === 1 ? fixture.detailPending : fixture.detailPublished,
        });
      }).as("getTutorDetail");

      cy.intercept("POST", "/api/tutor/questions/201/answer", {
        statusCode: 200,
        body: { ok: true },
      }).as("postTutorAnswer");
    });

    cy.visitAsRole("/tutor/pending", "tutor");

    cy.wait("@getTutorPending");
    cy.contains("Preguntas pendientes").should("be.visible");
    cy.get('[data-cy="tutor-open-detail"]').first().click();
    cy.wait("@getTutorDetail");
    cy.contains("Conversación de la pregunta").should("be.visible");

    cy.on("window:alert", (text) => {
      expect(text).to.include("Escribe la respuesta para el estudiante.");
    });
    cy.get('[data-cy="tutor-apply-action"]').click();

    cy.get('[data-cy="tutor-answer-body"]').type(
      "Puedes revisar la guía académica y confirmar el procedimiento con coordinación.",
    );
    cy.get('[data-cy="tutor-apply-action"]').click();

    cy.wait("@postTutorAnswer");
    cy.wait("@getTutorDetail");
    cy.contains("Retroalimentación e historial").click();
    cy.contains("Retroalimentación actual").should("be.visible");
  });
});
