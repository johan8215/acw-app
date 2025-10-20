/* ===========================================================
   ⚙️ ACW-App v4.5 – Connected Stable (LIVE)
   Author: Johan A. Giraldo (JG) & Sky
   =========================================================== */

const CONFIG = {
  /* 🌐 Servidor principal (Apps Script WebApp) */
  BASE_URL: "https://script.google.com/macros/s/AKfycbxbAmmkRL5zK-zsHGJ5Imx05qMqUv5NwQexXF9HjFoT1ZkluT2sr9GJAK43JBK0YpM3/exec",

  /* 🔑 CallMeBot API Key (mensajes manuales) */
  API_KEY: "4859356",

  /* 🕒 Opciones generales */
  LANG_DEFAULT: "en",            // idioma por defecto
  TIMEZONE: "America/New_York",  // zona horaria Boston
  DEBUG_MODE: false,             // true = logs de depuración

  /* 🧩 Metadatos de versión */
  APP_VERSION: "4.5 Connected & Messaging"
};

/* ✅ Debug Helper */
if (CONFIG.DEBUG_MODE) {
  console.log("✅ ACW-App Config Loaded", CONFIG);
}
