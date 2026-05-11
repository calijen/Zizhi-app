
import { FC, useState, useRef, useEffect, useCallback } from 'react';
import { Box, Stack, Text, Group, ActionIcon, Loader, ScrollArea, Avatar, Divider, Badge } from '@mantine/core';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconSparkles, IconClose, IconTrash, IconPlus, IconChevronLeft } from './icons';
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
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      const systemInstruction = `You are Phoebe, an insightful AI librarian for the Zizhi app. You have access to the following collection of highlights from the user's books. 
      Your goal is to help the user identify themes, answer questions, and explore their personal library of quotes. 
      Be sophisticated, warm, and encourage deep thinking. If the user's question cannot be answered by the quotes, let them know, but try to offer related wisdom from the authors present in their library.
      
      USER'S QUOTES:
      ${context}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...session.messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const modelResponseText = response.text || "I'm sorry, I couldn't process that request.";
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

  return (
    <div className="fixed inset-0 z-[2500] pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 md:inset-auto md:top-0 md:right-0 md:bottom-0 md:w-[450px] md:border-l-[8px] md:border-black bg-[var(--color-background)] flex flex-col pointer-events-auto shadow-none md:shadow-[-20px_0_60px_rgba(0,0,0,0.2)]"
        style={{ height: '100dvh' }}
      >
        <Box className="p-4 md:p-6 bg-yellow-300 border-b-4 border-black flex justify-between items-center shrink-0">
          <Group gap="xs">
            {isHistoryView ? (
              <ActionIcon variant="transparent" color="black" onClick={() => setIsHistoryView(false)}>
                <IconChevronLeft size={24} />
              </ActionIcon>
            ) : (
                <div className="w-10 h-10 bg-black flex items-center justify-center">
                    <IconSparkles className="w-6 h-6 text-yellow-300" />
                </div>
            )}
            <Stack gap={0}>
              <Text className="font-black uppercase tracking-widset text-[18px] leading-none">
                {isHistoryView ? 'History' : 'Phoebe'}
              </Text>
              <Text className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {isHistoryView ? 'Previous Chats' : 'Zizhi Librarian'}
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
                    className="rounded-none border-2 border-white shadow-[4px_4px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                    <Badge variant="filled" color="yellow" size="xs" circle className="absolute -top-1 -right-1 border-2 border-black font-black text-black">{sessions.length}</Badge>
                    <IconPlus size={24} className="rotate-45" /> {/* History icon substitute */}
                </ActionIcon>
            )}
            <ActionIcon 
                variant="filled" 
                onClick={onClose} 
                color="black" 
                size="xl" 
                className="rounded-none border-2 border-white shadow-[4px_4px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
                <IconClose size={24} />
            </ActionIcon>
          </Group>
        </Box>

        <ScrollArea className="flex-1 px-2 md:px-6 py-4 md:py-6" viewportRef={scrollRef}>
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
                <Box className="p-8 bg-[var(--color-surface)] border-4 border-black border-dashed text-center mt-10">
                  <Avatar size="xl" src="/phoebe-avatar.png" className="mx-auto mb-4 border-4 border-black shadow-[4px_4px_0_black]" />
                  <Text className="text-[16px] font-black uppercase text-black mb-2">Hello! I'm Phoebe.</Text>
                  <Text className="text-[12px] font-medium leading-relaxed opacity-70 mb-8">
                    Query your library of wisdom. I can find patterns, summarize authors, or just talk about the themes you love.
                  </Text>
                  <Stack gap="sm">
                    <button onClick={() => setInput("Identify the most recurring themes in my quotes.")} className="w-full p-3 text-[11px] uppercase font-black border-2 border-black hover:bg-black hover:text-white transition-colors bg-white"> 🔍 Recurring Themes </button>
                    <button onClick={() => setInput("Which book has the most impactful quotes according to my highlights?")} className="w-full p-3 text-[11px] uppercase font-black border-2 border-black hover:bg-black hover:text-white transition-colors bg-white"> 📚 Impactful Books </button>
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
        </ScrollArea>

        {!isHistoryView && (
            <Box className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6 md:p-6 border-t-[6px] border-black bg-[var(--color-surface)] shrink-0">
                <Group gap="xs" wrap="nowrap">
                    <div className="flex-1 relative">
                        <input 
                            className="w-full bg-white border-4 border-black p-4 pr-14 text-[16px] font-black placeholder:text-black/30 placeholder:uppercase text-black outline-none focus:ring-4 focus:ring-yellow-300 transition-all shadow-[6px_6px_0_black]"
                            placeholder="Message Phoebe..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            autoFocus
                        />
                    </div>
                    <ActionIcon 
                        onClick={handleSend}
                        variant="filled" 
                        color="yellow" 
                        size={56} 
                        className="rounded-none border-4 border-black shadow-[6px_6px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0 z-10"
                        disabled={isLoading || !input.trim()}
                        id="phoebe-send-btn"
                        aria-label="Send message"
                    >
                        <IconSend className="text-black w-6 h-6 stroke-[3]" />
                    </ActionIcon>
                </Group>
            </Box>
        )}
      </motion.div>
    </div>
  );
};

export default QuoteChat;
