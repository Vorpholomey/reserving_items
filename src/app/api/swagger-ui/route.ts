import { NextResponse } from 'next/server';

/**
 * GET /api/swagger-ui
 * Возвращает HTML-страницу Swagger UI, подгружающую OpenAPI документ с /api/docs.
 * Использует CDN для всех ресурсов Swagger UI, чтобы избежать проблем с TurboPack
 * и чтением файлов из node_modules.
 */
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API Документация | Reserving Items</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" crossorigin />
  <style>
    body { margin: 0; padding: 0; }
    #swagger-ui { max-width: 100%; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/docs',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
        displayOperationId: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        defaultModelsExpandDepth: -1,
        defaultModelExpandDepth: -1,
      });
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
