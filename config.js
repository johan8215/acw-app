/* ===========================================================
   ⚙️ ACW-App v4.5 – Connected Stable (LIVE)
   Author: Johan A. Giraldo (JG) & Sky
   =========================================================== */

const CONFIG = {
  /* 🌐 Google Apps Script endpoint (ACW backend) */
  BASE_URL: "https://script.google.com/macros/s/AKfycbyvKBaKxvAhoudDIXjUcmIef31ZTyvhujLRxzOoyQBneGpnpcnJkYpyzvXS3SCve4Z6/exec",

  /* 🔑 CallMeBot API Key (mensajes manuales) */
  API_KEY: "4859356",

  /* 🕒 Opciones generales */
  LANG_DEFAULT: "en",            // idioma por defecto
  TIMEZONE: "America/New_York",  // zona horaria Boston
  DEBUG_MODE: false              // true = logs de depuración
};

/* ✅ Debug Helper */
if (CONFIG.DEBUG_MODE) {
  console.log("✅ ACW-App Config Loaded", CONFIG);
}
