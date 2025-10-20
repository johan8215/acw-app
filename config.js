/* ===========================================================
   ⚙️ ACW-App v4.5 – Connected Stable (LIVE)
   Author: Johan A. Giraldo (JG) & Sky
   =========================================================== */

const CONFIG = {
  BASE_URL: "https://script.google.com/macros/s/AKfycbyDOlShXJaUAGqczuYQ0-NW9rIpRR372kW54ayPdjYsEbyNVAV-Ju_0-YQbyFUBmJ_T/exec",
  API_KEY: "4859356"
};
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
