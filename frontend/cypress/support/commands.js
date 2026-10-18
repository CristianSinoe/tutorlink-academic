function mockContext(user) {
  const roles = user.roles || [user.role];
  const institutionId = user.institutionId || 1;
  cy.intercept("GET", "/api/auth/institutions", { body: [{ institutionId, name: "Escuela de pruebas", roles }] });
  cy.intercept("POST", "/api/auth/context", { body: { token: user.token, role: user.role, roles, institutionId, email: user.email, name: user.name } });
  return { version: 2, token: user.token, role: user.role, roles, institutionId, email: user.email, name: user.name, selectedRole: roles[0] };
}

function getRecaptchaStubScript() {
  return `
    (() => {
      const currentScript = document.currentScript;
      const src = currentScript && currentScript.src ? new URL(currentScript.src) : null;
      const onloadName = src ? src.searchParams.get("onload") : null;

      globalThis.grecaptcha = {
        ready(callback) {
          if (typeof callback === "function") callback();
        },
        render(container, options = {}) {
          const target = typeof container === "string"
            ? document.getElementById(container)
            : container;

          if (target && !target.querySelector('[data-cy="mock-recaptcha-button"]')) {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = "Resolver reCAPTCHA";
            button.setAttribute("data-cy", "mock-recaptcha-button");
            button.addEventListener("click", () => {
              if (typeof options.callback === "function") {
                options.callback("test-recaptcha-token");
              }
            });
            target.appendChild(button);
          }

          return 0;
        },
        reset() {},
        getResponse() {
          return "test-recaptcha-token";
        },
      };

      if (onloadName && typeof globalThis[onloadName] === "function") {
        setTimeout(() => globalThis[onloadName](), 0);
      }
    })();
  `;
}

Cypress.Commands.add("mockRecaptcha", () => {
  cy.intercept("GET", /recaptcha\/api\.js.*/, {
    statusCode: 200,
    headers: { "content-type": "application/javascript" },
    body: getRecaptchaStubScript(),
  }).as("recaptchaApi");
});

Cypress.Commands.add("seedAuth", (role, overrides = {}) => {
  cy.fixture("users").then((users) => {
    const user = { ...users[role], ...overrides };
    const contextual = mockContext(user);
    globalThis.window.localStorage.setItem(
      "auth",
      JSON.stringify(contextual),
    );
  });
});

Cypress.Commands.add("visitAsRole", (path, role, overrides = {}) => {
  cy.fixture("users").then((users) => {
    const user = { ...users[role], ...overrides };
    const contextual = mockContext(user);
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "auth",
          JSON.stringify(contextual),
        );
      },
    });
  });
});

Cypress.Commands.add("mockStudentApis", () => {
  cy.fixture("users").then((users) => {
    cy.intercept("GET", "/api/me", {
      statusCode: 200,
      body: {
        id: 101,
        email: users.student.email,
        role: users.student.role,
        name: users.student.name,
      },
    }).as("getMe");
  });

  cy.fixture("questions").then((questions) => {
    cy.intercept("GET", "/api/student/questions/my*", {
      statusCode: 200,
      body: questions.studentList,
    }).as("getStudentQuestions");

    cy.intercept("GET", "/api/questions/101/messages", {
      statusCode: 200,
      body: questions.studentConversation,
    }).as("getStudentQuestionConversation");

    cy.intercept("POST", "/api/student/questions", {
      statusCode: 200,
      body: questions.createdQuestion,
    }).as("createStudentQuestion");

    cy.intercept("POST", "/api/questions/101/messages", {
      statusCode: 200,
      body: { ok: true },
    }).as("postStudentMessage");
  });
});

Cypress.Commands.add("mockTutorApis", () => {
  cy.fixture("tutor-pending").then((fixture) => {
    cy.intercept("GET", "/api/tutor/questions/pending/my*", {
      statusCode: 200,
      body: fixture.list,
    }).as("getTutorPending");
  });
});

Cypress.Commands.add("mockAdminApis", () => {
  const users = {
    items: [
      { userId: 2, name: "Tutor E2E", email: "tutor.e2e@example.test", status: "ACTIVE", roles: ["TUTOR"] },
      { userId: 3, name: "Estudiante E2E", email: "student.e2e@example.test", status: "ACTIVE", roles: ["ESTUDIANTE"] },
    ], total: 2, page: 0, size: 20,
  };
  const detail = { userId: 2, name: "Tutor E2E", lastNamePaterno: "Pruebas", email: "tutor.e2e@example.test", status: "ACTIVE", profiles: [{ role: "TUTOR", code: "T-2", department: "Tutorías" }], memberships: [{ role: "TUTOR", status: "ACTIVE" }] };
  cy.intercept("GET", "/api/admin/institution/users/2", { statusCode: 200, body: detail }).as("getInstitutionalUser");
  cy.intercept("GET", "/api/admin/institution/users/3", { statusCode: 200, body: { userId: 3, name: "Estudiante E2E", email: "student.e2e@example.test", status: "ACTIVE", profiles: [{ role: "ESTUDIANTE", code: "S-3", career: "ISC", semester: 2 }], memberships: [{ role: "ESTUDIANTE", status: "ACTIVE" }] } });
  cy.intercept("GET", "/api/admin/institution/users*", { statusCode: 200, body: users }).as("getInstitutionalUsers");
  cy.intercept("PATCH", "/api/admin/institution/users/2/roles/TUTOR/status", { statusCode: 200, body: {} }).as("patchInstitutionalMembership");
  cy.intercept("POST", "/api/admin/institution/users/import-csv*", { statusCode: 200, body: { total: 1, created: 1, invited: 0, skipped: 0, failed: 0, rows: [] } }).as("importInstitutionalCsv");
  cy.intercept("POST", "/api/admin/institution/users/import-excel*", { statusCode: 200, body: { total: 1, created: 1, invited: 0, skipped: 0, failed: 0, rows: [] } }).as("importInstitutionalExcel");
  cy.intercept("GET", "/api/admin/institution/users/invitations*", { statusCode: 200, body: { content: [{ id: 7, contactEmail: "invite@example.test", role: "ESTUDIANTE", expiresAt: "2030-01-01T00:00:00Z", status: "PENDING" }], page: 0, size: 20, totalElements: 1, totalPages: 1 } }).as("getInstitutionalInvitations");
  cy.intercept("POST", "/api/admin/institution/users/invitations", { statusCode: 201, body: {} }).as("createInstitutionalInvitation");
  cy.intercept("POST", "/api/admin/institution/users/invitations/7/resend", { statusCode: 204, body: {} }).as("resendInstitutionalInvitation");
  cy.intercept("DELETE", "/api/admin/institution/users/invitations/7", { statusCode: 204, body: {} }).as("cancelInstitutionalInvitation");

  cy.fixture("assignments").then((assignments) => {
    cy.intercept("GET", "/api/admin/users/tutor-students", {
      statusCode: 200,
      body: assignments.rows,
    }).as("getAssignments");

    cy.intercept("POST", "/api/admin/users/tutor-students/import-excel", {
      statusCode: 200,
      body: assignments.importResult,
    }).as("importAssignmentsExcel");
  });
});

Cypress.Commands.add("loginViaUiAs", (role) => {
  cy.fixture("users").then((users) => {
    const roleValue =
      typeof role === "object"
        ? role?.name ?? role?.value ?? role?.role ?? JSON.stringify(role)
        : role;
    const roleName = String(roleValue);
    const user = users[roleName];
    const contextual = mockContext(user);
    cy.mockRecaptcha();

    if (roleName === "student") {
      cy.mockStudentApis();
    } else if (roleName === "tutor") {
      cy.mockTutorApis();
    } else if (roleName === "admin") {
      cy.mockAdminApis();
    }

    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        requiresOtp: true,
        institutions: [{ institutionId: contextual.institutionId, name: "Escuela de pruebas", roles: contextual.roles }],
        otpToken: `${roleName}-otp-token`,
        message: "Se envió un código de verificación a tu correo institucional.",
        resendCooldownSeconds: 0,
      },
    }).as("loginRequest");

    cy.intercept("POST", "/api/auth/login/verify-otp", {
      statusCode: 200,
      body: {
        token: user.token,
        role: user.role,
        roles: contextual.roles,
        institutionId: contextual.institutionId,
        email: user.email,
        name: user.name,
      },
    }).as("verifyOtp");

    cy.visit("/login");
    cy.contains("Inicia sesión en TutorLink", { timeout: 10000 }).should("be.visible");
    cy.get('[data-cy="login-email"]').type(user.email);
    cy.get('[data-cy="login-password"]').type(user.password);
    cy.get('[data-cy="mock-recaptcha-button"]').click();
    cy.get('[data-cy="login-submit"]').click();
    cy.wait("@loginRequest");
    cy.url().should("include", "/otp");
    cy.get('[data-cy="otp-code"]').type("123456");
    cy.get('[data-cy="otp-submit"]').click();
    cy.wait("@verifyOtp");
  });
});
