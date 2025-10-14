
ACW-APP-2.0
============

1) Subir a GitHub
-----------------
- Crea/abre el repo: https://github.com/johan8215/acw-app
- Arrastra todos los archivos de esta carpeta al repo (o súbelos como zip y extrae).
- Commit: "ACW-APP-2.0 initial"

2) Deploy en Vercel
-------------------
- En Vercel, "Add New..." -> Project -> Importar desde tu GitHub (acw-app).
- Framework: "Other".
- Root directory: / (raíz).
- Deploy.

3) Variables importantes (ya embebidas)
---------------------------------------
- Google Sheet ID: 1HjPzkLLts7NlCou_94QSqwXezizc8MGQfob24RTdE9A
- Apps Script WebApp URL: https://script.google.com/macros/s/AKfycbyi8Yna3SRi2ag0qMoMgFT_XZB8x2l25-7Wle8dhEp3MbTQCHpOh17gBBDDSRhUP9Xx/exec
- Managers: johan8215@gmail.com, tito12079@gmail.com

4) Cómo funciona
----------------
- "Ver mi horario" llama al WebApp (action=view) y muestra la semana con formato "8 - 5 (9)" y Total.
- Enviar Hoy / Mañana / Updates: llama al WebApp (actions: sendToday, sendTomorrow, sendUpdates).
- Al terminar, muestra notificación del navegador (si el usuario lo permite).

5) PWA
------
- Incluye manifest y service worker para "Add to Home Screen".
- Ícono: acw-icon.png (azul con letras ACW).

6) Multi-idioma
---------------
- Selector arriba (Español/English).

7) Editar Managers / URL
------------------------
- Abre index.html -> window.ACW_CONFIG y edita MANAGERS o WEBAPP_URL.
