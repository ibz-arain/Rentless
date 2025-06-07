'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface Conversation {
  conversation_id: number;
  partner: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string | null;
  };
  last_message_at: string | null;
  unread_count: number;
}

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (session) {
      fetch('/api/conversations')
        .then(res => res.json())
        .then((data: Conversation[]) => setConversations(data));
    }
  }, [session]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 border-r overflow-y-auto">
        {conversations.map(conv => (
          <Link
            key={conv.conversation_id}
            href={`/chat/${conv.conversation_id}`}
            className="block"
          >
            <div className="flex items-center p-4 hover:bg-gray-100 cursor-pointer">
              {conv.partner.profile_picture ? (
                <Image
                  src={conv.partner.profile_picture}
                  alt={`${conv.partner.first_name} ${conv.partner.last_name}`}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="h-10 w-10 bg-gray-300 rounded-full" />
              )}
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {conv.partner.first_name} {conv.partner.last_name}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2">{conv.unread_count}</span>
                  )}
                </div>
                {conv.last_message_at && (
                  <div className="text-sm text-gray-500">
                    {new Date(conv.last_message_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="w-3/4 flex flex-col">
        {children}
      </div>
    </div>
  );
} 