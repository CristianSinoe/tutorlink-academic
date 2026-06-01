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
        globalThis[onloadName]();
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
    globalThis.window.localStorage.setItem(
      "auth",
      JSON.stringify({
        token: user.token,
        role: user.role,
        email: user.email,
        name: user.name,
      }),
    );
  });
});

Cypress.Commands.add("visitAsRole", (path, role, overrides = {}) => {
  cy.fixture("users").then((users) => {
    const user = { ...users[role], ...overrides };
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          "auth",
          JSON.stringify({
            token: user.token,
            role: user.role,
            email: user.email,
            name: user.name,
          }),
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
  cy.fixture("admin-users").then((users) => {
    cy.intercept("GET", "/api/admin/users", {
      statusCode: 200,
      body: users,
    }).as("getAdminUsers");
  });

  cy.fixture("assignments").then((assignments) => {
    cy.intercept("GET", "/api/admin/users/tutor-students", {
      statusCode: 200,
      body: assignments.rows,
    }).as("getAssignments");

    cy.intercept("POST", "/api/admin/users/tutor-students/import-csv", {
      statusCode: 200,
      body: assignments.importResult,
    }).as("importAssignmentsCsv");
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
        email: user.email,
        name: user.name,
      },
    }).as("verifyOtp");

    cy.visit("/login");
    cy.contains("Inicia sesión en TutorLink", { timeout: 10000 }).should("be.visible");
    cy.get('[data-cy="login-email"]').type(user.email);
    cy.get('[data-cy="login-password"]').type(user.password);
    cy.get('[data-cy="login-submit"]').click();
    cy.wait("@loginRequest");
    cy.url().should("include", "/otp");
    cy.get('[data-cy="otp-code"]').type("123456");
    cy.get('[data-cy="otp-submit"]').click();
    cy.wait("@verifyOtp");
  });
});
