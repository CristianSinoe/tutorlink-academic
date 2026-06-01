describe("TutorLink student flow", () => {
  it("permite registrar una pregunta y verla en el historial", () => {
    cy.on("window:alert", (text) => {
      expect(text).to.include("Pregunta enviada correctamente.");
    });

    cy.mockStudentApis();
    cy.visitAsRole("/student/ask", "student");

    cy.contains("Formulario de pregunta").should("be.visible");
    cy.get('input[name="title"]').type("Duda sobre inscripcion");
    cy.get('select[name="scope"]').select("ACADEMICO");
    cy.get('textarea[name="body"]').type(
      "Necesito saber si puedo registrar una experiencia educativa fuera de tiempo.",
    );
    cy.get('[data-cy="student-ask-submit"]').click();

    cy.wait("@createStudentQuestion");
    cy.location("pathname").should("eq", "/student/questions");
    cy.location("search").should("include", "questionId=101");
    cy.wait("@getStudentQuestions");
    cy.contains("Duda sobre inscripcion").should("be.visible");
    cy.contains("Pendiente").should("be.visible");
  });
});
