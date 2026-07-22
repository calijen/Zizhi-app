
import { FC, useState, useRef, useEffect, useCallback } from 'react';
import { Box, Stack, Text, Group, ActionIcon, Loader, ScrollArea, Avatar, Divider, Badge } from '@mantine/core';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconSparkles, IconClose, IconTrash, IconPlus, IconChevronLeft, IconQuote, IconHistory } from './icons';
import type { Quote, ChatMessage, ChatSession } from '../types';
import * as db from '../db';

interface QuoteChatProps {
  quotes: Quote[];
  onClose: () => void;
}

const QuoteChat: FC<QuoteChatProps> = ({ quotes, onClose }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryView, setIsHistoryView] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  const loadSessions = useCallback(async () => {
    const data = await db.getChatSessions();
    setSessions(data);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [currentSession?.messages, isHistoryView]);

  const startNewSession = () => {
    setCurrentSession(null);
    setIsHistoryView(false);
    setInput('');
  };

  const selectSession = (session: ChatSession) => {
    setCurrentSession(session);
    setIsHistoryView(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await db.deleteChatSession(id);
    if (currentSession?.id === id) {
      setCurrentSession(null);
    }
    loadSessions();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: userMessageText,
      timestamp: Date.now()
    };

    let session = currentSession;
    if (!session) {
      session = {
        id: crypto.randomUUID(),
        title: userMessageText.slice(0, 40) + (userMessageText.length > 40 ? '...' : ''),
        messages: [userMessage],
        createdAt: Date.now(),
        lastUpdatedAt: Date.now()
      };
    } else {
      session = {
        ...session,
        messages: [...session.messages, userMessage],
        lastUpdatedAt: Date.now()
      };
    }

    setCurrentSession(session);
    setIsLoading(true);

    try {
      const context = quotes.map(q => `Book: ${q.bookTitle} by ${q.author}\nQuote: "${q.text}"`).join('\n\n');
      const systemInstruction = `You are Zizhi, an insightful AI librarian for the Zizhi app. You have access to the following collection of highlights from the user's books. 
      Your goal is to help the user identify themes, answer questions, and explore their personal library of quotes. 
      Be sophisticated, warm, and encourage deep thinking. If the user's question cannot be answered by the quotes, let them know, but try to offer related wisdom from the authors present in their library.
      
      USER'S QUOTES:
      ${context}`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash",
        systemInstruction,
      });

      const response = await model.generateContent({
        contents: [
          ...session.messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        ],
        generationConfig: {
          temperature: 0.7,
        }
      });

      const modelResponseText = response.response.text() || "I'm sorry, I couldn't process that request.";
      const modelMessage: ChatMessage = {
        role: 'model',
        content: modelResponseText,
        timestamp: Date.now()
      };

      const updatedSession = {
        ...session,
        messages: [...session.messages, modelMessage],
        lastUpdatedAt: Date.now()
      };

      setCurrentSession(updatedSession);
      await db.saveChatSession(updatedSession);
      await loadSessions();
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: "Error connecting to the AI service. Please try again.",
        timestamp: Date.now()
      };
      const errorSession = {
        ...session,
        messages: [...session.messages, errorMessage],
        lastUpdatedAt: Date.now()
      };
      setCurrentSession(errorSession);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[2500] pointer-events-auto md:pointer-events-none bg-black/40 md:bg-transparent flex items-end justify-center md:items-end md:justify-end p-0 md:p-6 md:pr-10 transition-colors duration-300"
      onClick={handleOverlayClick}
    >
      <motion.div
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.8 }}
        onDragEnd={(event, info) => {
          if (info.offset.y > 150 || info.velocity.y > 600) {
            onClose();
          }
        }}
        initial={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        exit={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full md:max-w-[450px] h-[100dvh] md:h-[650px] md:max-h-[85vh] bg-[var(--color-background)] border-t-8 border-x-0 md:border-x-4 md:border-4 border-black flex flex-col pointer-events-auto shadow-[0_-15px_50px_rgba(0,0,0,0.3),20px_20px_0_rgba(0,0,0,0.1)] relative overflow-hidden rounded-t-[24px] md:rounded-t-none"
      >
        {isMobile && (
          <div className="flex flex-col items-center justify-center pt-3 pb-1 bg-yellow-300 cursor-grab active:cursor-grabbing shrink-0">
            <div className="w-16 h-1.5 bg-black/30 rounded-full" />
          </div>
        )}
        <Box className="p-4 md:p-5 bg-yellow-300 border-b-4 border-black flex justify-between items-center shrink-0">
          <Group gap="sm" align="center" wrap="nowrap">
            {isHistoryView ? (
              <ActionIcon variant="transparent" color="black" onClick={() => setIsHistoryView(false)}>
                <IconChevronLeft size={24} />
              </ActionIcon>
            ) : (
                <div className="w-10 h-10 bg-black flex items-center justify-center rounded-full overflow-hidden border-2 border-black shadow-[2px_2px_0_black] shrink-0">
                    <img src="/phoebe.png" alt="Zizhi" className="w-full h-full object-contain" />
                </div>
            )}
            <Stack gap={0} className="overflow-hidden">
              <Text className="font-black uppercase tracking-widest text-[18px] leading-tight truncate text-black">
                {isHistoryView ? 'History' : 'Zizhi'}
              </Text>
              <Text className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none text-black">
                {isHistoryView ? 'Previous Chats' : 'AI Librarian'}
              </Text>
            </Stack>
          </Group>
          <Group gap="xs">
            {!isHistoryView && (
                <ActionIcon 
                    variant="filled" 
                    onClick={() => setIsHistoryView(true)} 
                    color="black" 
                    size="xl" 
                    className="rounded-none border-2 border-black shadow-[4px_4px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all relative overflow-visible"
                >
                    <Badge variant="filled" color="yellow" size="xs" circle className="absolute -top-2 -right-2 border-2 border-black font-black text-black z-10">{sessions.length}</Badge>
                    <IconHistory size={22} className="text-yellow-300" />
                </ActionIcon>
            )}
            <ActionIcon 
                variant="filled" 
                onClick={onClose} 
                color="black" 
                size="xl" 
                className="rounded-none border-2 border-black shadow-[4px_4px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
                <IconClose size={22} className="text-yellow-300" />
            </ActionIcon>
          </Group>
        </Box>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          <ScrollArea className="h-full" viewportRef={scrollRef}>
            <div className="p-4 md:p-6">
              {isHistoryView ? (
            <Stack gap="md" py="md">
              <button 
                onClick={startNewSession}
                className="w-full p-4 bg-white border-4 border-black border-dashed flex items-center gap-3 hover:bg-yellow-50 transition-colors"
                id="new-chat-btn"
              >
                <IconPlus className="w-5 h-5 text-black" />
                <Text className="font-black uppercase text-[14px]">Start New Chat</Text>
              </button>
              
              <Divider label="Previous Conversations" labelPosition="center" color="black" className="my-4 font-black" />
              
              {sessions.length === 0 ? (
                <Text className="text-center italic opacity-50 py-10">No history yet.</Text>
              ) : (
                sessions.map(s => (
                  <Box 
                    key={s.id} 
                    onClick={() => selectSession(s)}
                    className="p-4 bg-[var(--color-surface)] border-4 border-black shadow-[4px_4px_0_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_black] transition-all cursor-pointer group"
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Stack gap={2}>
                        <Text className="font-bold text-[14px] line-clamp-1">{s.title}</Text>
                        <Text className="text-[10px] opacity-60">{new Date(s.lastUpdatedAt).toLocaleDateString()}</Text>
                      </Stack>
                      <ActionIcon 
                         variant="transparent" 
                         color="red" 
                         onClick={(e) => handleDeleteSession(e, s.id)}
                         className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Box>
                ))
              )}
            </Stack>
          ) : (
            <Stack gap="xl" pb="xl" pt="md">
              {(currentSession?.messages || []).length === 0 && (
                <Box className="p-8 bg-[var(--color-surface)] border-4 border-black border-dashed text-center mt-4">
                  <div className="w-20 h-20 mx-auto mb-4 border-4 border-black shadow-[4px_4px_0_black] rounded-full bg-yellow-300 overflow-hidden">
                    <img src="/phoebe.png" alt="Zizhi" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=phoebe&backgroundColor=FACC15'; }} />
                  </div>
                  <Text className="text-[16px] font-black uppercase text-[var(--color-primary-text)] mb-2">Hello! I'm Zizhi.</Text>
                  <Text className="text-[12px] font-medium leading-relaxed opacity-70 mb-8 text-[var(--color-primary-text)]">
                    Query your library of wisdom. I can find patterns, summarize authors, or just talk about the themes you love.
                  </Text>
                  <Stack gap="sm">
                    <button onClick={() => setInput("Identify the most recurring themes in my quotes.")} className="w-full p-3 text-[11px] uppercase font-black border-2 border-black hover:bg-black hover:text-white transition-colors bg-white text-black shadow-[2px_2px_0_black]"> 🔍 Recurring Themes </button>
                    <button onClick={() => setInput("Which book has the most impactful quotes according to my highlights?")} className="w-full p-3 text-[11px] uppercase font-black border-2 border-black hover:bg-black hover:text-white transition-colors bg-white text-black shadow-[2px_2px_0_black]"> 📚 Impactful Books </button>
                  </Stack>
                </Box>
              )}
              {(currentSession?.messages || []).map((msg, i) => (
                <Box 
                  key={i} 
                  className={`p-5 max-w-[90%] border-4 border-black shadow-[6px_6px_0_black] relative ${
                    msg.role === 'user' 
                      ? 'ml-auto bg-cyan-400 text-black' 
                      : 'bg-white text-black'
                  }`}
                >
                  <Text className="text-[15px] font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</Text>
                  <Text className="text-[9px] mt-2 opacity-40 uppercase font-black">{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                </Box>
              ))}
              {isLoading && (
                <Box className="bg-white p-5 self-start border-4 border-black shadow-[6px_6px_0_black]">
                  <Loader size="sm" color="black" variant="dots" />
                </Box>
              )}
            </Stack>
          )}
        </div>
      </ScrollArea>
    </div>

        {!isHistoryView && (
            <Box className="p-4 pb-8 md:pb-6 md:p-6 border-t-[6px] border-black bg-[var(--color-surface)] shrink-0">
                <Group gap="md" wrap="nowrap">
                    <div className="flex-1 relative">
                        <input 
                            className="w-full bg-white border-4 border-black p-4 pr-14 text-[16px] font-black placeholder:text-black/30 placeholder:uppercase text-black outline-none focus:ring-4 focus:ring-yellow-300 transition-all shadow-[6px_6px_0_black]"
                            placeholder="Zizhi Oracle..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            autoFocus
                        />
                        {/* Hidden Send icon just in case the button disappears */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden pointer-events-none opacity-20">
                            <IconSend size={20} className="text-black" />
                        </div>
                    </div>
                    <ActionIcon 
                        onClick={handleSend}
                        variant="filled" 
                        color="yellow" 
                        size={56} 
                        className={`rounded-none border-4 border-black shadow-[6px_6px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0 z-10`}
                        disabled={isLoading || !input.trim()}
                        id="phoebe-send-btn"
                        aria-label="Send message"
                    >
                        <IconSend className="text-black w-6 h-6" />
                    </ActionIcon>
                </Group>
            </Box>
        )}
      </motion.div>
    </div>
  );
};

export default QuoteChat;
