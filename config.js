/* ===========================================================
   ⚙️ ACW-App v4.6.4 – Connected & Messaging (LIVE)
   Author: Johan A. Giraldo (JG15) & Sky
   =========================================================== */

const CONFIG = {
  /* 🌐 Backend principal (Apps Script Web App) */
  BASE_URL: "https://script.google.com/macros/s/AKfycbyY55LeXxMtlrNovUtnLKrEblrel6ljRnBjOpB2qWNSUnyMPLmWTuzScqSYGStKZ-2l/exec",

  /* 🔑 CallMeBot API Key (para mensajes manuales) */
  API_KEY: "4859356",

  /* 🌍 Opciones generales */
  LANG_DEFAULT: "en",
  TIMEZONE: "America/New_York",
  DEBUG_MODE: false,

  /* 🧩 Información de build */
  APP_NAME: "Allston Car Wash App",
  APP_VERSION: "v4.6.4 Smart Hybrid Ready",
  BUILD_DATE: "2025-10-20"
};

/* ===========================================================
   🧠 DEBUG / Versión flotante
   =========================================================== */
if (CONFIG.DEBUG_MODE)
  console.log("✅ ACW-App Config Loaded", CONFIG);

window.addEventListener("DOMContentLoaded", () => {
  const tag = document.createElement("div");
  tag.textContent = CONFIG.APP_VERSION;
  Object.assign(tag.style, {
    position: "fixed",
    bottom: "4px",
    right: "8px",
    fontSize: "11px",
    color: "rgba(204,0,0,0.7)",
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(204,0,0,0.2)",
    borderRadius: "6px",
    padding: "2px 6px",
    zIndex: "9999",
    fontFamily: "SF Pro Display, Segoe UI, sans-serif"
  });
  document.body.appendChild(tag);
});
