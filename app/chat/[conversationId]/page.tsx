'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
  is_read: boolean;
}

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const conversationId = params.conversationId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !conversationId) return;

    const socketClient: Socket = io();
    socketClient.on('connect', () => {
      socketClient.emit('join', conversationId);
    });
    socketClient.on('message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });
    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [status, conversationId]);

  useEffect(() => {
    if (status !== 'authenticated' || !conversationId) return;

    fetch(`/api/conversations/${conversationId}/messages`)
      .then((res) => res.json())
      .then((data: Message[]) => {
        setMessages(data);
        scrollToBottom();
      });
  }, [status, conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() }),
    });
    if (res.ok) {
      const newMessage = await res.json();
      setMessages((prev) => [...prev, newMessage]);
      setInput('');
      scrollToBottom();
      socket?.emit('message', newMessage);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (status !== 'authenticated') {
    return <div>Please sign in to access this chat.</div>;
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.map((msg) => (
          <div
            key={msg.message_id}
            className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.sender_id === session?.user?.id
                ? 'bg-blue-500 text-white self-end'
                : 'bg-gray-200 text-black self-start'
            }`}
          >
            <p>{msg.content}</p>
            <span className="text-xs text-gray-500">
              {new Date(msg.sent_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </form>
    </div>
  );
} 