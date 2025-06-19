'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { User, MessageCircle, Search, ChevronLeft, Menu, X, Home, DollarSign, Bed, Bath } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { io, Socket } from 'socket.io-client';

interface Conversation {
  conversation_id: number;
  property: {
    property_id: number;
    title: string;
    address: string;
    images: string[] | null;
    monthly_rent: number;
    bedrooms: number;
    bathrooms: number;
  };
  partner: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string | null;
  };
  last_message_at: string | null;
  unread_count: number;
  last_message?: string | null;
}

export default function ChatLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const currentConversationId = pathname.split('/').pop();
  const isConversationSelected = pathname !== '/chat';
  const router = useRouter();
  
  useEffect(() => {
    if (session) {
      fetch('/api/conversations')
        .then(res => res.json())
        .then((data: Conversation[]) => {
          // Sort conversations by last message time (most recent first)
          const sortedData = [...data].sort((a, b) => {
            if (!a.last_message_at) return 1;
            if (!b.last_message_at) return -1;
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
          });
          setConversations(sortedData);
          
          // If no conversations and user is not initiating a new chat, redirect to properties
          if (sortedData.length === 0 && pathname === '/chat') {
            router.push('/properties');
          }
        });
    }
  }, [session, pathname, router]); // Refresh when pathname changes to update unread counts

  // Establish socket connection
  useEffect(() => {
    if (!session) return;
    const newSocket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      query: { userId: session.user.id }
    });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [session]);

  // Handle incoming real-time events to keep conversation list fresh
  useEffect(() => {
    if (!socket || !session) return;

    const handleMessage = (message: any) => {
      setConversations(prev => {
        const existingIdx = prev.findIndex(c => c.conversation_id === message.conversation_id);
        let updated = [...prev];
        if (existingIdx !== -1) {
          const conv = { ...updated[existingIdx] };
          conv.last_message_at = message.sent_at;
          conv.last_message = message.content;
          if (message.sender_id !== session.user.id) {
            conv.unread_count = (conv.unread_count || 0) + 1;
          }
          updated[existingIdx] = conv;
        } else {
          // New conversation – refetch list
          fetch('/api/conversations')
            .then(res => res.json())
            .then((data: Conversation[]) => {
              updated = data;
              setConversations(updated);
            });
        }
        // Sort by latest message
        updated.sort((a, b) => {
          if (!a.last_message_at) return 1;
          if (!b.last_message_at) return -1;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });
        return updated;
      });
    };

    const handleMessagesRead = (data: { messageIds: number[]; conversationId: number }) => {
      const { conversationId } = data;
      setConversations(prev => prev.map(c => c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c));
    };

    socket.on('message', handleMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('message', handleMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, session]);

  // Reset unread count when the conversation is opened
  useEffect(() => {
    if (!currentConversationId) return;
    setConversations(prev => prev.map(c => c.conversation_id.toString() === currentConversationId ? { ...c, unread_count: 0 } : c));
  }, [currentConversationId]);

  // Hide mobile menu when selecting a conversation
  useEffect(() => {
    if (isConversationSelected) {
      setShowMobileMenu(false);
    }
  }, [pathname, isConversationSelected]);

  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const fullName = `${conv.partner.first_name} ${conv.partner.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 flex justify-center items-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null;
  }

  // If no conversations and the user is on the conversations list root, show empty state
  if (conversations.length === 0 && pathname === '/chat') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-hidden container mx-auto px-2 sm:px-4 py-3">
          <Card className="flex h-full overflow-hidden border-border shadow-md relative">
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Start a conversation from a property listing</p>
              <Button onClick={() => router.push('/properties')}>
                Browse Properties
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden container mx-auto px-0 sm:px-4 py-0 sm:py-3">
        <Card className="flex h-full overflow-hidden border-border shadow-md relative sm:rounded-lg rounded-none">
          {/* Mobile Back Button - Only visible on small screens when conversation is selected */}
          {isConversationSelected && (
            <button 
              className="md:hidden absolute top-3 left-3 z-50 p-2 rounded-full bg-background/90 hover:bg-muted/90 backdrop-blur-sm transition-colors shadow-sm"
              onClick={() => router.push('/chat')}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          
          {/* Conversations Sidebar */}
          <AnimatePresence>
            {(!isConversationSelected || showMobileMenu || (isConversationSelected && !showMobileMenu)) && (
              <motion.div 
                className={`
                  ${isConversationSelected ? 'hidden md:flex' : 'flex w-full'} 
                  ${showMobileMenu ? 'absolute inset-0 z-40 bg-background md:relative md:inset-auto md:z-auto' : ''}
                  md:w-80 lg:w-96 flex-col h-full border-r border-border
                  transition-all duration-300 ease-in-out
                `}
                initial={{ x: isConversationSelected ? -300 : 0, opacity: isConversationSelected ? 0 : 1 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <div className="p-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                  <h2 className="text-lg font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                    Messages
                  </h2>
                  <div className="mt-2 relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-2 pl-9 pr-3 rounded-full bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="overflow-y-auto flex-1 bg-background/50">
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      {searchQuery ? (
                        <>
                          <p className="text-muted-foreground font-medium">No conversations found</p>
                          <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground font-medium">No conversations yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Start a conversation from a property listing</p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredConversations.map(conv => {
                      const isActive = currentConversationId === conv.conversation_id.toString();
                      return (
                        <Link
                          key={conv.conversation_id}
                          href={`/chat/${conv.conversation_id}?property=${conv.property.property_id}`}
                          className="block"
                        >
                          <motion.div 
                            className={`
                              flex items-center p-3 border-b border-border/40 last:border-b-0
                              ${isActive 
                                ? 'bg-primary/5 border-l-4 border-l-primary' 
                                : 'hover:bg-muted/50 border-l-4 border-l-transparent'
                              } 
                              transition-colors duration-150
                            `}
                            whileHover={{ backgroundColor: isActive ? undefined : 'rgba(var(--muted), 0.7)' }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex-shrink-0 relative mr-3">
                              <div className="relative">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {conv.partner.profile_picture ? (
                                    <Image
                                      src={conv.partner.profile_picture}
                                      alt={`${conv.partner.first_name} ${conv.partner.last_name}`}
                                      width={48}
                                      height={48}
                                      className="object-cover h-full w-full"
                                    />
                                  ) : (
                                    <User className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                                {conv.unread_count > 0 && (
                                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium shadow-sm animate-pulse">
                                    {conv.unread_count}
                                  </div>
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-muted border-2 border-background overflow-hidden">
                                {conv.property.images && conv.property.images.length > 0 ? (
                                  <Image
                                    src={conv.property.images[0]}
                                    alt={conv.property.title}
                                    width={24}
                                    height={24}
                                    className="object-cover h-full w-full"
                                  />
                                ) : (
                                  <Home className="h-3 w-3 text-muted-foreground m-auto" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <span className={`font-medium text-sm truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                    {conv.partner.first_name} {conv.partner.last_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {conv.last_message ? conv.last_message : conv.property.title}
                                  </span>
                                </div>
                                {conv.last_message_at && (
                                  <span className={`text-xs ${conv.unread_count > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                    {formatLastActive(conv.last_message_at)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 mr-2">
                                  <DollarSign className="h-3 w-3" />
                                  ${conv.property.monthly_rent.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 mr-2">
                                  <Bed className="h-3 w-3" />
                                  {conv.property.bedrooms}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Bath className="h-3 w-3" />
                                  {conv.property.bathrooms}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentConversationId || 'home'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                ${(!isConversationSelected) ? 'hidden md:flex' : 'flex w-full'}
                flex-1 flex-col relative overflow-hidden bg-background/20
              `}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
} 