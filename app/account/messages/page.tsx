'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Conversation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/messages');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/conversations').then(res => res.json()).then(setConversations);
    }
  }, [status]);

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      {conversations.length === 0 && <p>No conversations yet.</p>}
      {conversations.map(conv => {
        const otherName = conv.first_name ? `${conv.first_name} ${conv.last_name}` : `User ${conv.other_user_id}`;
        return (
          <Link key={conv.conversation_id} href={`/account/messages/${conv.conversation_id}`}
            className="block">
            <Card className="mb-2">
              <CardContent className="flex items-center justify-between py-3">
                <span>{otherName}</span>
                {conv.unread_count > 0 && <Badge>{conv.unread_count}</Badge>}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
