'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/components/SocketProvider';
import { Message, Conversation } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ConversationPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [content, setContent] = useState('');
  const convoId = params.conversationId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/messages');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch(`/api/conversations?conversationId=${convoId}`)
        .then(res => res.json())
        .then(res => setConversation(res[0]));
      fetch(`/api/messages?conversationId=${convoId}`)
        .then(res => res.json())
        .then(setMessages);
    }
  }, [status, convoId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join', `conv-${convoId}`);
    socket.on('message', (msg: Message) => {
      setMessages((m) => [...m, msg]);
    });
    return () => {
      socket.off('message');
    };
  }, [socket, convoId]);

  const sendMessage = async () => {
    if (!content.trim()) return;
    const receiverId = conversation?.user1_id === session!.user.id ? conversation?.user2_id : conversation?.user1_id;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convoId, receiver_id: receiverId, content }),
    });
    if (res.ok) {
      const data = await res.json();
      const msg: Message = { message_id: data.message_id, conversation_id: Number(convoId), sender_id: session!.user.id, receiver_id: receiverId!, content, sent_at: new Date().toISOString(), is_read: false };
      socket?.emit('message', `conv-${convoId}`, msg);
      setMessages((m) => [...m, msg]);
      setContent('');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4 space-y-2">
        {messages.map(m => (
          <div key={m.message_id} className={`p-2 rounded ${m.sender_id === session?.user.id ? 'bg-blue-100 self-end text-right' : 'bg-gray-100'}`}>{m.content}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={content} onChange={e => setContent(e.target.value)} className="flex-1" />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
