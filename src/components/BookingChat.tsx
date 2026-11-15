'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface BookingChatProps {
  bookingId: string;
  currentUserId: string;
}

export default function BookingChat({
  bookingId,
  currentUserId,
}: BookingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [bookingId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setSendMessageError(null);
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      } else {
        const data = await res.json();
        setSendMessageError(data.error ?? "Не удалось отправить сообщение");
      }
    } catch (error) {
      setSendMessageError("Ошибка сети при отправке сообщения");
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col border border-gray-300 rounded-lg h-[400px] bg-white dark:bg-gray-900">
      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  isMine
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="text-xs font-medium mb-1">
                  {msg.sender.name || msg.sender.email}
                </div>
                <div className="text-sm break-words">{msg.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    isMine ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Сообщение об ошибке */}
      {sendMessageError && (
        <div className="mx-3 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sendMessageError}
        </div>
      )}

      {/* Форма отправки */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 p-3 border-t border-gray-300 dark:border-gray-700"
      >
        <textarea
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (sendMessageError) setSendMessageError(null);
          }}
          placeholder="Введите сообщение..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Отправить
        </button>
      </form>
    </div>
  );
}
