'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { createItem, type CreateItemInput } from '@/actions/item-actions';
import { useRouter } from 'next/navigation';

export default function ItemForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState(['']);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const addImageField = () => {
    setImages((prev) => [...prev, '']);
  };

  const removeImageField = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, value: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? value : img)));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const imageData = images.filter((img) => img.trim() !== '');

      const data: CreateItemInput = {
        title: title.trim(),
        description: description.trim(),
        pricePerDay: Number(pricePerDay),
        depositAmount: Number(depositAmount),
        category: category.trim(),
        images: imageData,
        latitude,
        longitude,
      };

      const result = await createItem(data);
      router.push(`/items/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании вещи');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Название *
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Например: Камера Canon EOS R6"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Описание *
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
          placeholder="Подробно опишите вещь: состояние, комплектация, особенности использования..."
        />
      </div>

      {/* Price & Deposit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700 mb-1">
            Цена за день (₽) *
          </label>
          <input
            id="pricePerDay"
            type="number"
            required
            min="0"
            step="0.01"
            value={pricePerDay}
            onChange={(e) => setPricePerDay(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="1500"
          />
        </div>
        <div>
          <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Залог (₽) *
          </label>
          <input
            id="depositAmount"
            type="number"
            required
            min="0"
            step="0.01"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="5000"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Категория *
        </label>
        <input
          id="category"
          type="text"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Например: Фотоаппараты"
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL изображений
        </label>
        <div className="space-y-3">
          {images.map((img, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={img}
                onChange={(e) => updateImage(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="px-3 py-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  aria-label="Удалить поле изображения"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageField}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-blue-300 text-blue-600 font-bold">
              +
            </span>
            Добавить URL изображения
          </button>
        </div>
      </div>

      {/* Geolocation */}
      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Геолокация</p>
        {locationStatus === 'loading' && (
          <p className="text-sm text-gray-500">Определение местоположения...</p>
        )}
        {locationStatus === 'success' && (
          <p className="text-sm text-green-600">
            ✓ Локация определена: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
          </p>
        )}
        {locationStatus === 'error' && (
          <p className="text-sm text-amber-600">
            ⚠ Не удалось определить локацию — вещь будет создана без координат
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Создание...' : 'Создать вещь'}
      </button>
    </form>
  );
}
