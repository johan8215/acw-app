/* ===========================================================
   ⚙️ ACW-App v4.5 – Connected Stable
   Author: Johan A. Giraldo (JG) & Sky
   =========================================================== */

const CONFIG = {
  /* =======================================================
     🌐 GOOGLE APPS SCRIPT ENDPOINT (Allston Car Wash)
     ======================================================= */
  BASE_URL: "https://script.google.com/macros/s/AKfycbyvKBaKxvAhoudDIXjUcmIef31ZTyvhujLRxzOoyQBneGpnpcnJkYpyzvXS3SCve4Z6/exec",

  /* =======================================================
     🔑 CALLMEBOT API KEY — para mensajes manuales
     (ejemplo: "123456" — cámbiala por la tuya)
     ======================================================= */
  API_KEY: "123456",

  /* =======================================================
     🕒 OPCIONES GENERALES
     ======================================================= */
  LANG_DEFAULT: "en",            // "en" o "es"
  TIMEZONE: "America/New_York",  // zona horaria Boston
  DEBUG_MODE: false              // true = logs en consola
};

/* ===========================================================
   🔍 Debug Helper
   =========================================================== */
if (CONFIG.DEBUG_MODE) {
  console.log("✅ ACW-App Config Loaded", CONFIG);
}
