'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { User, MessageCircle, Search, ChevronLeft, Menu, X } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const currentConversationId = pathname.split('/').pop();
  const isConversationSelected = pathname !== '/chat';
  
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
        });
    }
  }, [session, pathname]); // Refresh when pathname changes to update unread counts

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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden container mx-auto px-2 sm:px-4 py-3">
        <Card className="flex h-full overflow-hidden border-border shadow-md relative">
          {/* Mobile Toggle Button - Only visible on small screens */}
          {isConversationSelected && (
            <button 
              className="md:hidden absolute top-3 left-3 z-50 p-2 rounded-full bg-background/90 hover:bg-muted/90 backdrop-blur-sm transition-colors shadow-sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
          
          {/* Conversations Sidebar */}
          <AnimatePresence>
            {(showMobileMenu || !isConversationSelected || (isConversationSelected && !showMobileMenu)) && (
              <motion.div 
                className={`
                  ${isConversationSelected && !showMobileMenu ? 'hidden md:flex' : 'flex'} 
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
                          href={`/chat/${conv.conversation_id}`}
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
                              {isActive && (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                              )}
                            </div>
                            <div className="ml-3 flex-1 overflow-hidden">
                              <div className="flex justify-between items-center">
                                <span className={`font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                  {conv.partner.first_name} {conv.partner.last_name}
                                </span>
                                {conv.last_message_at && (
                                  <span className={`text-xs ${conv.unread_count > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                    {formatLastActive(conv.last_message_at)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                  {conv.last_message_at ? 
                                    `Last active ${formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}` : 
                                    `Start chatting with ${conv.partner.first_name}`
                                  }
                                </p>
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
                ${(!isConversationSelected || showMobileMenu) ? 'hidden md:flex' : 'flex'}
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