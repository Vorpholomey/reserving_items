import { redirect } from 'next/navigation';

export const metadata = {
  title: 'API Документация | Reserving Items',
  description: 'Интерактивная Swagger документация для API платформы аренды вещей',
};

export default function ApiDocsPage() {
  // Редирект на серверный роут, который отдаёт HTML с Swagger UI.
  // Это позволяет избежать проблем с TurboPack и swagger-ui-react,
  // так как swagger-ui-dist использует статические файлы + CDN.
  redirect('/api/swagger-ui');
}
