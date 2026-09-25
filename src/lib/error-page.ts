export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@700&family=Poppins:wght@400;500&display=swap" rel="stylesheet" />
    <style>
      body { font: 15px/1.6 "Poppins", system-ui, -apple-system, sans-serif; background: #F9FAFB; color: #1F2937; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; background: #fff; border: 1px solid rgba(31,41,55,0.08); border-radius: 16px; }
      h1 { font: 700 1.375rem/1.2 "Quicksand", system-ui, sans-serif; margin: 0 0 0.5rem; }
      p { color: #6B7280; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { height: 40px; padding: 0 18px; display: inline-flex; align-items: center; border-radius: 8px; font: inherit; font-weight: 500; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #8FC5D1; color: #1F2937; }
      .primary:hover { background: #7cb8c6; }
      .secondary { background: #fff; color: #1F2937; border-color: rgba(31,41,55,0.14); }
      .secondary:hover { border-color: rgba(31,41,55,0.3); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
