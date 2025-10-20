/* ===========================================================
   ⚙️ ACW-App v4.5 Configuration File
   Author: Johan A. Giraldo (JG) & Sky
   =========================================================== */

const CONFIG = {
  /* =======================================================
     🌐 GOOGLE APPS SCRIPT ENDPOINT
     Reemplaza esta URL por tu Script WebApp desplegado:
     ======================================================= */
  BASE_URL: "https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/exec",

  /* =======================================================
     🔑 CALLMEBOT API KEY (para mensajes manuales)
     Puedes generarla gratis en: https://www.callmebot.com/
     ======================================================= */
  API_KEY: "123456",  // <-- tu clave aquí

  /* =======================================================
     🕒 OPCIONES DE FORMATO Y SISTEMA
     ======================================================= */
  LANG_DEFAULT: "en",         // "en" o "es"
  TIMEZONE: "America/New_York",
  DEBUG_MODE: false            // true = log extra en consola
};

/* ===========================================================
   🔍 Helper global (debug)
   =========================================================== */
if (CONFIG.DEBUG_MODE) {
  console.log("✅ ACW-App Config Loaded", CONFIG);
}
