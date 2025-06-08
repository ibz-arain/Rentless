'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, Send, User, Smile, Home, Calendar, DollarSign, Info
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
  is_read: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Partner {
  user_id: number;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
  online_status?: 'online' | 'offline' | 'away';
  last_active?: string;
}

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [partner, setPartner] = useState<Partner | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Typing indicator logic
  const sendTypingEvent = useCallback(() => {
    if (socket && conversationId) {
      socket.emit('typing', { conversationId, isTyping: true });
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        socket.emit('typing', { conversationId, isTyping: false });
      }, 3000);
      
      setTypingTimeout(timeout);
    }
  }, [socket, conversationId, typingTimeout]);

  useEffect(() => {
    if (status !== 'authenticated' || !conversationId) return;

    // Initialize socket with authentication info
    const socketClient: Socket = io({ auth: { userId: session.user.id } });
    socketClient.on('connect', () => {
      // Join conversation room
      socketClient.emit('join', conversationId);
    });
    
    // Handle incoming messages
    socketClient.on('message', (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates if we already have this message
        if (prev.some(m => m.message_id === message.message_id)) {
          return prev;
        }
        return [...prev, message];
      });
      scrollToBottom();
      // Acknowledge delivery if message is from partner
      if (message.sender_id !== session.user.id) {
        socketClient.emit('delivered', { conversationId, messageIds: [message.message_id] });
        // Mark as read as soon as delivered
        socketClient.emit('read', { conversationId, messageId: message.message_id });
      }
    });
    
    // Typing indicator from partner
    socketClient.on('typing', ({ userId, isTyping }) => {
      if (userId !== session?.user?.id) {
        setIsPartnerTyping(isTyping);
      }
    });
    
    // Read receipts from partner
    socketClient.on('read', ({ messageIds, userId }) => {
      if (userId !== session.user.id) {
        setMessages(prev => 
          prev.map(msg => 
            messageIds.includes(msg.message_id) 
              ? { ...msg, is_read: true, status: 'read' } 
              : msg
          )
        );
      }
    });
    
    // Delivery receipts
    socketClient.on('delivered', ({ messageIds, userId }) => {
      if (userId !== session.user.id) {
        setMessages(prev => 
          prev.map(msg => 
            messageIds.includes(msg.message_id) && msg.status !== 'read'
              ? { ...msg, status: 'delivered' } 
              : msg
          )
        );
      }
    });
    
    // Partner online/offline status
    socketClient.on('status', ({ userId, status: userStatus }) => {
      if (userId === partner?.user_id) {
        setPartner(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            online_status: userStatus,
            // on going offline, update last_active to now for accurate 'last seen'
            last_active: userStatus === 'offline' ? new Date().toISOString() : prev.last_active
          };
        });
      }
    });

    setSocket(socketClient);

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      socketClient.disconnect();
    };
  }, [status, conversationId, session?.user?.id]);

  useEffect(() => {
    if (status !== 'authenticated' || !conversationId) return;

    // Mark conversation as read when opened
    fetch(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
    }).catch(err => console.error('Error marking conversation as read:', err));

    // Fetch partner info
    fetch(`/api/conversations`)
      .then((res) => res.json())
      .then((data) => {
        const conversation = data.find((c: any) => 
          c.conversation_id.toString() === conversationId.toString()
        );
        if (conversation) {
          setPartner({
            ...conversation.partner,
            online_status: 'offline',
            last_active: conversation.last_message_at
          });
        }
      })
      .catch(err => console.error('Error fetching conversation partner:', err));

    // Fetch messages
    fetch(`/api/conversations/${conversationId}/messages`)
      .then((res) => res.json())
      .then((data: Message[]) => {
        // Add status field based on is_read
        const messagesWithStatus = data.map(msg => ({
          ...msg,
          status: msg.is_read 
            ? 'read' 
            : msg.sender_id === session.user.id 
              ? 'delivered' 
              : undefined
        } as Message));
        setMessages(messagesWithStatus);
        scrollToBottom();
      })
      .catch(err => console.error('Error fetching messages:', err));
  }, [status, conversationId, session?.user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    // Optimistically add the message
    const tempId = Date.now();
    const optimisticMsg: Message = {
      message_id: tempId,
      sender_id: session?.user?.id as number,
      receiver_id: partner?.user_id as number,
      content: input.trim(),
      sent_at: new Date().toISOString(),
      is_read: false,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    scrollToBottom();
    
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      
      if (res.ok) {
        const newMessage = await res.json();
        // Replace optimistic message with the real one
        setMessages(prev => 
          prev.map(msg => 
            msg.message_id === tempId 
              ? { ...newMessage, status: 'sent' }
              : msg
          )
        );
        socket?.emit('message', newMessage);
        
        // No simulation: real delivery and read events will come from server
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show the message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === tempId 
            ? { ...msg, status: 'error' as any }
            : msg
        )
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTypingEvent();
  };

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }
  
  if (status !== 'authenticated') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-4">Please sign in to access messages</h3>
          <Link href="/login?callbackUrl=/chat" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <span className="text-xs text-muted-foreground">Sending...</span>;
      case 'sent':
        return <span className="text-xs text-muted-foreground">Sent</span>;
      case 'delivered':
        return <span className="text-xs text-muted-foreground">Delivered</span>;
      case 'read':
        return <span className="text-xs text-primary">Seen</span>;
      default:
        return null;
    }
  };

  // Group messages by sender (consecutive messages from same sender)
  const groupedMessages = messages.reduce<{
    sender: number;
    messages: Message[];
    date: string;
  }[]>((groups, message) => {
    const lastGroup = groups[groups.length - 1];
    
    // Check if we need a new group (different sender or different day)
    const messageDate = new Date(message.sent_at).toDateString();
    const needNewGroup = !lastGroup || 
      lastGroup.sender !== message.sender_id || 
      lastGroup.date !== messageDate;
    
    if (needNewGroup) {
      groups.push({
        sender: message.sender_id,
        messages: [message],
        date: messageDate
      });
    } else {
      lastGroup.messages.push(message);
    }
    
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border p-3 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative h-9 w-9 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
            {partner?.profile_picture ? (
              <Image 
                src={partner.profile_picture} 
                alt={`${partner.first_name} ${partner.last_name}`}
                width={36}
                height={36}
                className="object-cover h-full w-full"
              />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
            {partner?.online_status === 'online' && (
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card"></div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">
              {partner ? `${partner.first_name} ${partner.last_name}` : 'Chat'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isPartnerTyping ? (
                <span className="text-primary">Typing...</span>
              ) : partner?.online_status === 'online' ? (
                'Online now'
              ) : partner?.last_active ? (
                `Last seen ${formatDistanceToNow(new Date(partner.last_active), { addSuffix: true })}`
              ) : (
                ''
              )}
            </p>
          </div>
        </div>
        <div className="flex space-x-1">
          <button 
            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full hover:bg-primary/20 transition-colors"
            onClick={() => router.push('/properties')}
          >
            View Listings
          </button>
        </div>
      </div>
      
      {/* Messages area - using flex-grow instead of fixed height */}
      <div 
        ref={messagesContainerRef}
        className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        <div className="flex flex-col p-4 space-y-3 pb-6 min-h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground my-auto">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Home className="h-10 w-10 text-primary/60" />
              </div>
              <p className="text-center font-medium">No messages yet</p>
              <p className="text-sm">Ask about property details, availability, or pricing</p>
              <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
                <button 
                  className="bg-muted/60 hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg text-sm text-left transition-colors"
                  onClick={() => setInput("Is this property still available?")}
                >
                  Is this property still available?
                </button>
                <button 
                  className="bg-muted/60 hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg text-sm text-left transition-colors"
                  onClick={() => setInput("What's included in the monthly rent?")}
                >
                  What's included in the monthly rent?
                </button>
                <button 
                  className="bg-muted/60 hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg text-sm text-left transition-colors"
                  onClick={() => setInput("Can I schedule a viewing?")}
                >
                  Can I schedule a viewing?
                </button>
              </div>
            </div>
          ) : (
            // Display grouped messages
            <>
              {groupedMessages.map((group, groupIndex) => {
                const isSender = group.sender === session?.user?.id;
                const showDateSeparator = groupIndex === 0 || 
                  group.date !== groupedMessages[groupIndex - 1].date;
                
                return (
                  <React.Fragment key={`group-${groupIndex}`}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-3">
                        <div className="px-3 py-1 bg-muted/70 rounded-full text-xs text-muted-foreground shadow-sm">
                          {new Date(group.messages[0].sent_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-1 relative`}>
                      {!isSender && (
                        <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden mr-2 self-start mt-2">
                          {partner?.profile_picture ? (
                            <Image 
                              src={partner.profile_picture} 
                              alt={`${partner.first_name}`}
                              width={32}
                              height={32}
                              className="object-cover h-full w-full"
                            />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      
                      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        {/* Messages bubble */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="flex flex-col gap-1"
                        >
                          {group.messages.map((msg, msgIndex) => {
                            const isFirst = msgIndex === 0;
                            const isLast = msgIndex === group.messages.length - 1;
                            
                            return (
                              <div 
                                key={msg.message_id} 
                                className={`
                                  px-4 py-2.5 
                                  ${isSender 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted/80 text-foreground'
                                  }
                                  ${isFirst && (isSender ? 'rounded-tr-none' : 'rounded-tl-none')}
                                  ${isFirst ? 'rounded-t-2xl' : 'rounded-t-md'}
                                  ${isLast ? 'rounded-b-2xl' : 'rounded-b-md'}
                                  ${!isLast ? 'mb-[2px]' : ''}
                                  shadow-sm
                                `}
                              >
                                <p className="text-sm">{msg.content}</p>
                              </div>
                            );
                          })}
                        </motion.div>
                        
                        {/* Timestamp and read status only for the last message */}
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(group.messages[group.messages.length - 1].sent_at)}
                          </span>
                          {isSender && getStatusIcon(group.messages[group.messages.length - 1].status)}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div className="py-3" ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Typing indicator for partner - Instagram style */}
        <AnimatePresence>
          {isPartnerTyping && (
            <motion.div 
              className="fixed bottom-20 left-8 md:left-1/4 md:ml-8 z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: "easeOut" 
              }}
            >
              <div className="bg-card/90 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full shadow-md border border-border/50 flex items-center gap-1.5">
                <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted">
                  {partner?.profile_picture ? (
                    <Image 
                      src={partner.profile_picture} 
                      alt={`${partner.first_name}`}
                      width={20}
                      height={20}
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce mr-0.5" style={{ animationDelay: '0ms' }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce mr-0.5" style={{ animationDelay: '150ms' }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Message input */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border p-3 sticky bottom-0 flex-shrink-0">
        {/* Quick response buttons */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <button 
            className="text-xs bg-muted/70 text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted transition-colors"
            onClick={() => setInput("Is this property still available?")}
          >
            <Calendar className="h-3 w-3 inline mr-1" /> Availability
          </button>
          <button 
            className="text-xs bg-muted/70 text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted transition-colors"
            onClick={() => setInput("What's the security deposit amount?")}
          >
            <DollarSign className="h-3 w-3 inline mr-1" /> Deposit
          </button>
          <button 
            className="text-xs bg-muted/70 text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted transition-colors"
            onClick={() => setInput("Can I schedule a viewing?")}
          >
            <Calendar className="h-3 w-3 inline mr-1" /> Schedule viewing
          </button>
          <button 
            className="text-xs bg-muted/70 text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted transition-colors"
            onClick={() => setInput("Are utilities included in the rent?")}
          >
            <Info className="h-3 w-3 inline mr-1" /> Utilities
          </button>
          <button 
            className="text-xs bg-muted/70 text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted transition-colors"
            onClick={() => setInput("What's the lease term?")}
          >
            <Info className="h-3 w-3 inline mr-1" /> Lease term
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 pr-10 border border-input rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-sm"
              placeholder="Ask about the property..."
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className={`p-2.5 rounded-full ${
              input.trim() 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-muted text-muted-foreground'
            } transition-colors flex-shrink-0`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 