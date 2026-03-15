# BurlonAI para Firefox

Extensión simple de Firefox que detecta búsquedas en Google, DuckDuckGo o Bing y muestra una notificación con una respuesta burlona generada por Gemini.

## Archivos

- `manifest.json`: configuración de la WebExtension.
- `background.js`: lógica para detectar búsquedas y llamar a Gemini.

## Cómo usar

1. Copia esta carpeta en tu máquina.
2. Abre Firefox en `about:debugging`.
3. Entra a **This Firefox** → **Load Temporary Add-on**.
4. Selecciona `manifest.json`.
5. Configura tu API key en consola de la extensión:

```js
browser.storage.local.set({ geminiApiKey: "TU_API_KEY" });
```

Si quieres usar la clave que compartiste, colócala ahí.

## Personalizar el tono de la IA

Puedes cambiar el estilo de las respuestas en caliente (sin tocar código) desde la consola de la extensión:

```js
browser.storage.local.set({
  aiTone: "irónico y seco",
  aiMaxWords: 14
});
```

- `aiTone`: describe el tono (ej. `amigable y juguetón`, `dramático`, `sarcástico ligero`).
- `aiMaxWords`: limita cuántas palabras máximas puede usar la respuesta.

Si quieres volver a los valores por defecto:

```js
browser.storage.local.remove(["aiTone", "aiMaxWords"]);
```

## Nota ética

La respuesta está limitada a burlas ligeras y cortas para evitar contenido ofensivo extremo.
