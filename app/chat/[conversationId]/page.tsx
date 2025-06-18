'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, Send, User, Smile, Home, Calendar, DollarSign, Info, ExternalLink, Bed, Bath, Car, Dog, ChevronLeft, MessageCircle, Check, CheckCheck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Message {
  message_id: number;
  sender_id: number;
  content: string;
  sent_at: string;
  is_read: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'error';
  conversation_id?: number;
  receiver_id?: number;
}

interface Partner {
  user_id: number;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
  online_status?: 'online' | 'offline' | 'away';
  last_active?: string;
}

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
  messages: Message[];
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
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property');
  const [isLandlord, setIsLandlord] = useState(false);
  const [localMessageMap, setLocalMessageMap] = useState<Record<number, Message>>({});

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

  // Initialize socket connection
  useEffect(() => {
    if (!session || !conversationId) return;

    // Create socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      query: {
        userId: session.user.id,
        conversationId
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('typing', (data: { userId: number }) => {
      if (data.userId !== session.user.id) {
        setIsPartnerTyping(true);
        // Clear typing indicator after 3 seconds of inactivity
        setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3000);
      }
    });

    // Handle message status updates
    newSocket.on('message_status', (data: { messageId: number, status: 'sent' | 'delivered' | 'read' }) => {
      setMessages(prev => prev.map(msg => 
        msg.message_id === data.messageId 
          ? { ...msg, status: data.status, is_read: data.status === 'read' }
          : msg
      ));
    });

    // Handle bulk read status updates
    newSocket.on('messages_read', (data: { messageIds: number[] }) => {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg.message_id) 
          ? { ...msg, status: 'read', is_read: true }
          : msg
      ));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [session, conversationId]);

  // Fetch messages
  useEffect(() => {
    if (!session || !conversationId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        
        // Mark messages as having appropriate status
        const processedMessages = data.map((msg: Message) => ({
          ...msg,
          status: msg.is_read ? 'read' : (msg.sender_id === session.user.id ? 'sent' : undefined)
        }));
        
        setMessages(processedMessages);
        
        // Create a map of messages for quick lookup
        const msgMap: Record<number, Message> = {};
        processedMessages.forEach((msg: Message) => {
          msgMap[msg.message_id] = msg;
        });
        setLocalMessageMap(msgMap);
        
        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [session, conversationId]);

  // Update message status when received
  useEffect(() => {
    if (!socket || !session || !conversationId) return;

    // Emit read status for partner's messages
    const partnerMessages = messages.filter(
      msg => msg.sender_id !== session.user.id && !msg.is_read
    );
    
    if (partnerMessages.length > 0) {
      const messageIds = partnerMessages.map(msg => msg.message_id);
      socket.emit('read_messages', { 
        messageIds,
        conversationId
      });
      
      // Update local state to reflect read status
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.message_id) 
          ? { ...msg, is_read: true }
          : msg
      ));
    }
  }, [messages, socket, session, conversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle message sending
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !session || !conversationId) return;

    // Create a temporary message with pending status
    const tempMessage: Message = {
      message_id: Date.now(), // Temporary ID
      sender_id: session.user.id as number,
      content: input,
      sent_at: new Date().toISOString(),
      is_read: false,
      status: 'sent'
    };

    // Add to local messages immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Clear input and scroll
    setInput('');
    scrollToBottom();

    try {
      // Send to server
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Update the temporary message with the real one
      setMessages(prev => prev.map(msg => 
        msg === tempMessage ? { ...data, status: 'sent' } : msg
      ));
      
      // Emit sent status
      socket.emit('message_status', {
        messageId: data.message_id,
        status: 'sent',
        conversationId
      });
      
      // After a short delay, update to delivered (simulating network delay)
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.message_id === data.message_id ? { ...msg, status: 'delivered' } : msg
        ));
        
        // Emit delivered status
        socket.emit('message_status', {
          messageId: data.message_id,
          status: 'delivered',
          conversationId
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Update the temporary message to show error
      setMessages(prev => prev.map(msg => 
        msg === tempMessage ? { ...msg, status: 'error' } : msg
      ));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTypingEvent();
  };

  // Determine if current user is landlord
  useEffect(() => {
    if (conversation && session) {
      const isUserLandlord = conversation.partner.user_id !== session.user.id;
      setIsLandlord(!isUserLandlord);
    }
  }, [conversation, session]);

  // Group messages by sender and date
  const groupedMessages = useMemo(() => {
    if (!messages.length) return [];
    
    const groups: {
      sender: number;
      date: string;
      messages: Message[];
    }[] = [];
    
    let currentGroup: {
      sender: number;
      date: string;
      messages: Message[];
    } | null = null;
    
    messages.forEach(message => {
      const messageDate = new Date(message.sent_at).toLocaleDateString();
      
      if (
        !currentGroup || 
        currentGroup.sender !== message.sender_id ||
        currentGroup.date !== messageDate ||
        // Group messages that are more than 5 minutes apart separately
        (currentGroup.messages.length > 0 &&
          new Date(message.sent_at).getTime() - 
          new Date(currentGroup.messages[currentGroup.messages.length - 1].sent_at).getTime() > 5 * 60 * 1000)
      ) {
        currentGroup = {
          sender: message.sender_id,
          date: messageDate,
          messages: [message]
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });
    
    return groups;
  }, [messages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  // Fetch conversation metadata for header
  useEffect(() => {
    if (!session || !conversationId) return;
    const fetchConversation = async () => {
      try {
        const res = await fetch('/api/conversations');
        if (!res.ok) return;
        const convs = await res.json();
        const found = convs.find((c: any) => c.conversation_id.toString() === conversationId.toString());
        if (found) {
          setConversation(found);
          setPartner({
            ...found.partner,
            online_status: found.partner.online_status || 'offline',
            last_active: found.last_message_at,
          });
          setIsLandlord(session.user.id === found.landlord_id);
        }
      } catch (err) {
        console.error('Error fetching conversation metadata', err);
      }
    };
    fetchConversation();
  }, [session, conversationId]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        {conversation && (
          <div className="flex items-center gap-3">
            <Link href="/chat" className="md:hidden flex-shrink-0 -ml-1 p-1.5 rounded-full hover:bg-muted/50 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center">
              <div className="relative h-10 w-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                {partner?.profile_picture ? (
                  <Image
                    src={partner.profile_picture}
                    alt={`${partner.first_name} ${partner.last_name}`}
                    width={40}
                    height={40}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
                {partner?.online_status === 'online' && (
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card"></div>
                )}
              </div>
              <div className="ml-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-sm">
                    {partner ? `${partner.first_name} ${partner.last_name}` : 'Chat'}
                  </h2>
                  <Badge variant="outline" className="text-xs font-normal bg-muted/50">
                    {isLandlord ? 'Tenant' : 'Landlord'}
                  </Badge>
                </div>
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
            
            <div className="ml-auto flex items-center gap-2">
              <Link 
                href={`/properties/${conversation.property.property_id}`}
                className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View Property</span>
              </Link>
            </div>
          </div>
        )}
        
        {/* Property mini info */}
        {conversation && (
          <div className="flex items-center mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
            <Link href={`/properties/${conversation.property.property_id}`} className="flex items-center hover:text-foreground transition-colors">
              <div className="h-5 w-5 rounded bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden mr-2">
                {conversation.property.images && conversation.property.images.length > 0 ? (
                  <Image
                    src={conversation.property.images[0]}
                    alt={conversation.property.title}
                    width={20}
                    height={20}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <Home className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <span className="font-medium truncate max-w-[180px]">{conversation.property.title}</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ${conversation.property.monthly_rent.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                {conversation.property.bedrooms}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {conversation.property.bathrooms}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 sm:pb-4" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Start the conversation by sending a message</p>
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
                      <div className="px-3 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground">
                        {new Date(group.messages[0].sent_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-3 relative`}>
                    {!isSender && (
                      <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden mr-2 self-end mb-1">
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
                      <div className="flex flex-col gap-1">
                        {group.messages.map((msg, msgIndex) => {
                          const isFirst = msgIndex === 0;
                          const isLast = msgIndex === group.messages.length - 1;
                          
                          return (
                            <div 
                              key={msg.message_id} 
                              className={`
                                p-3 
                                ${isSender 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-foreground'
                                }
                                ${isFirst && isLast ? 'rounded-2xl' : ''}
                                ${isFirst && !isLast ? 'rounded-t-2xl rounded-bl-2xl rounded-br-md' : ''}
                                ${!isFirst && isLast ? 'rounded-b-2xl rounded-tr-md rounded-tl-md' : ''}
                                ${!isFirst && !isLast ? 'rounded-tr-md rounded-tl-md rounded-bl-md rounded-br-md' : ''}
                                ${isSender && isLast ? 'rounded-br-sm' : ''}
                                ${!isSender && isLast ? 'rounded-bl-sm' : ''}
                                ${!isLast ? 'mb-[2px]' : ''}
                              `}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Timestamp and read status only for the last message */}
                      <div className="flex items-center mt-1 space-x-1.5">
                        <span className={`text-xs ${isSender ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {formatTime(group.messages[group.messages.length - 1].sent_at)}
                        </span>
                        {isSender && getStatusIcon(group.messages[group.messages.length - 1].status || (group.messages[group.messages.length - 1].is_read ? 'read' : 'sent'))}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
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

      {/* Quick response buttons - Hide on small screens */}
      <div className="hidden sm:block bg-card/80 backdrop-blur-sm border-t border-border p-3 flex-shrink-0">
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
          <button 
            className="text-xs bg-muted/70 text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted transition-colors"
            onClick={() => setInput("Is parking available?")}
          >
            <Car className="h-3 w-3 inline mr-1" /> Parking
          </button>
          <button 
            className="text-xs bg-muted/70 text-muted-foreground px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-muted transition-colors"
            onClick={() => setInput("Are pets allowed?")}
          >
            <Dog className="h-3 w-3 inline mr-1" /> Pets
          </button>
        </div>
      </div>
        
      {/* Message Input - Fixed at bottom on mobile */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border p-3 sticky bottom-0 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full py-2 px-3 rounded-full bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 