
import { FC, useState, useRef, useEffect } from 'react';
import { Box, Stack, Text, Group, ActionIcon, Loader, ScrollArea } from '@mantine/core';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconSparkles, IconClose } from './icons';
import type { Quote } from '../types';

interface QuoteChatProps {
  quotes: Quote[];
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

const QuoteChat: FC<QuoteChatProps> = ({ quotes, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
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
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const modelResponse = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', content: modelResponse }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Error connecting to the AI service. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
      />

      {/* Drawer Container */}
      <motion.div
        initial={{ y: '100%', x: 0 }}
        animate={{ y: 0, x: 0 }}
        exit={{ y: '100%', x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 inset-x-0 top-[20%] md:top-0 md:left-auto md:right-0 md:w-[450px] bg-[var(--color-background)] border-t-[8px] md:border-t-0 md:border-l-[8px] border-black flex flex-col pointer-events-auto rounded-t-[40px] md:rounded-t-none shadow-[-20px_0_60px_rgba(0,0,0,0.2)]"
      >
        <Box className="p-6 bg-yellow-300 border-b-4 border-black flex justify-between items-center rounded-t-[32px] md:rounded-t-none">
          <Group gap="xs">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <IconSparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <Stack gap={0}>
              <Text className="font-black uppercase tracking-widset text-[18px] leading-none">Phoebe</Text>
              <Text className="text-[10px] font-black uppercase tracking-widest opacity-60">Zizhi Librarian</Text>
            </Stack>
          </Group>
          <ActionIcon 
            variant="filled" 
            onClick={onClose} 
            color="black" 
            size="xl" 
            className="rounded-none border-2 border-white shadow-[4px_4px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <IconClose size={24} />
          </ActionIcon>
        </Box>

        <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
          <Stack gap="xl" pb="xl">
            {messages.length === 0 && (
              <Box className="p-8 bg-[var(--color-surface)] border-4 border-black border-dashed text-center">
                <Text className="text-[14px] font-black uppercase text-black mb-4">Hello! I'm Phoebe.</Text>
                <Text className="text-[12px] font-medium leading-relaxed opacity-70 mb-6">
                  I've read through all your highlights. Ask me to find connections, summarize themes, or explore the wisdom you've collected.
                </Text>
                <div className="space-y-2">
                  <button onClick={() => setInput("What are the recurring themes in my highlights?")} className="w-full p-2 text-[10px] uppercase font-black border-2 border-black hover:bg-black hover:text-white transition-colors"> Recurring Themes </button>
                  <button onClick={() => setInput("Can you summarize the sentiment of my library?")} className="w-full p-2 text-[10px] uppercase font-black border-2 border-black hover:bg-black hover:text-white transition-colors"> Library Sentiment </button>
                </div>
              </Box>
            )}
            {messages.map((msg, i) => (
              <Box 
                key={i} 
                className={`p-5 max-w-[90%] border-4 border-black shadow-[6px_6px_0_black] ${
                  msg.role === 'user' 
                    ? 'ml-auto bg-cyan-400 text-black' 
                    : 'bg-white text-black'
                }`}
              >
                <Text className="text-[15px] font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</Text>
              </Box>
            ))}
            {isLoading && (
              <Box className="bg-white p-5 self-start border-4 border-black shadow-[6px_6px_0_black]">
                <Loader size="sm" color="black" variant="dots" />
              </Box>
            )}
          </Stack>
        </ScrollArea>

        <Box className="p-6 border-t-[6px] border-black bg-[var(--color-surface)]">
          <Group gap="md">
            <input 
              className="flex-1 bg-white border-4 border-black p-4 text-[16px] font-black placeholder:text-black/30 placeholder:uppercase text-black outline-none focus:ring-4 focus:ring-yellow-300 transition-all shadow-[6px_6px_0_black]"
              placeholder="Query your collection..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              autoFocus
            />
            <ActionIcon 
              onClick={handleSend}
              variant="filled" 
              color="yellow" 
              size={56} 
              className={`rounded-none border-4 border-black shadow-[6px_6px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:grayscale disabled:opacity-50`}
              disabled={isLoading || !input.trim()}
            >
              <IconSend className="text-black w-6 h-6" />
            </ActionIcon>
          </Group>
        </Box>
      </motion.div>
    </div>
  );
};

export default QuoteChat;
