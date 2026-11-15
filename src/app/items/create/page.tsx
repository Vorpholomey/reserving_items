import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ItemForm from '@/components/ItemForm';

export default async function CreateItemPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        Добавить вещь
      </h1>
      <p className="mb-8 text-gray-600">
        Заполните форму, чтобы разместить вещь для аренды.
      </p>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <ItemForm />
      </div>
    </div>
  );
}
