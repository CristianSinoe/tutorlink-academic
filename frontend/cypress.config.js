import { defineConfig } from "cypress";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import XLSX from "xlsx";

function e2eOtp(socketPath, secret, request) {
  if (!socketPath || !secret || !request?.email || !request?.otpToken) {
    throw new Error("El puente OTP E2E no está configurado.");
  }
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    let response = "";
    socket.setTimeout(5000);
    socket.on("connect", () => socket.end(`${JSON.stringify({ ...request, secret })}\n`));
    socket.on("data", chunk => { response += chunk; });
    socket.on("timeout", () => reject(new Error("Tiempo de espera del puente OTP E2E.")));
    socket.on("error", reject);
    socket.on("close", () => {
      try {
        const data = JSON.parse(response);
        if (!data?.ok || !/^\d{6}$/.test(data.code)) throw new Error("OTP E2E no disponible para el desafío solicitado.");
        resolve(data.code);
      } catch (error) { reject(error); }
    });
  });
}

function e2eXlsx({ suffix }) {
  const safeSuffix = String(suffix || Date.now()).replace(/[^a-zA-Z0-9-]/g, "");
  const file = path.join(os.tmpdir(), `tutorlink-e2e-students-${safeSuffix}.xlsx`);
  const rows = [["name", "lastNamePaterno", "email", "code", "career", "plan", "semester"],
    [`Excel${safeSuffix}`, "Prueba", `xlsx-${safeSuffix}@example.invalid`, `XLSX-${safeSuffix}`, "ISC", "2026", 2]];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Estudiantes");
  XLSX.writeFile(workbook, file);
  return file;
}

export default defineConfig({
  video: true,
  screenshotsFolder: "cypress/screenshots",
  videosFolder: "cypress/videos",
  fixturesFolder: "cypress/fixtures",
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.js",
    setupNodeEvents(on, config) {
      if (config.env.DESIGN_CAPTURE) {
        on('before:browser:launch', (browser, launchOptions) => {
          if (browser.name === 'electron') {
            launchOptions.preferences.width = 1920;
            launchOptions.preferences.height = 1080;
          }
          return launchOptions;
        });
      }
      if (process.env.CYPRESS_REAL_E2E === "true") {
        const socketPath = process.env.TUTORLINK_E2E_IPC_SOCKET;
        const secret = process.env.TUTORLINK_E2E_IPC_TOKEN;
        on("task", {
          e2eOtp: request => e2eOtp(socketPath, secret, request),
          e2eXlsx,
          removeE2eFile: file => { if (file) fs.rmSync(file, { force: true }); return null; },
        });
      }
      return config;
    },
  },
});
