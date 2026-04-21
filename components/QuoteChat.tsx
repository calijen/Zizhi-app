
import { FC, useState, useRef, useEffect } from 'react';
import { Box, Stack, Text, Group, ActionIcon, Loader, ScrollArea } from '@mantine/core';
import { GoogleGenAI } from "@google/genai";
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
      const systemInstruction = `You are an AI librarian for the Zizhi app. You have access to the following collection of highlights from the user's books. 
      Your goal is to help the user identify themes, answer questions, and explore their personal library of quotes. 
      Be insightful, concise, and encourage deep thinking. If the user's question cannot be answered by the quotes, let them know, but try to offer related wisdom from the authors present in their library.
      
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
    <Box className="fixed inset-0 z-[2000] flex flex-col bg-[var(--color-background)] animate-fade-in md:inset-auto md:bottom-24 md:right-8 md:w-[400px] md:h-[600px] md:border-4 md:border-black md:shadow-[12px_12px_0_black]">
      <Box className="p-4 bg-cyan-400 border-b-4 border-black flex justify-between items-center">
        <Group gap="xs">
          <IconSparkles className="w-5 h-5 text-black" />
          <Text className="font-black uppercase tracking-widest text-[13px]">Zizhi Oracle</Text>
        </Group>
        <ActionIcon variant="transparent" onClick={onClose} color="dark">
          <IconClose size={20} />
        </ActionIcon>
      </Box>

      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <Stack gap="md" pb="xl">
          {messages.length === 0 && (
            <Box className="p-6 bg-[var(--color-surface)] border-2 border-dashed border-black text-center">
              <Text className="text-[11px] font-black uppercase opacity-60">Ask anything about your highlights.</Text>
              <Text className="text-[10px] mt-2 opacity-50 italic">"What themes connect my quotes from Lora?"</Text>
              <Text className="text-[10px] opacity-50 italic">"Summarize the general sentiment of my library."</Text>
            </Box>
          )}
          {messages.map((msg, i) => (
            <Box 
              key={i} 
              className={`p-3 max-w-[85%] border-2 border-black shadow-[3px_3px_0_black] ${
                msg.role === 'user' 
                  ? 'ml-auto bg-white text-black' 
                  : 'bg-yellow-300 text-black'
              }`}
            >
              <Text className="text-[13px] font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</Text>
            </Box>
          ))}
          {isLoading && (
            <Box className="bg-yellow-300 p-3 self-start border-2 border-black shadow-[3px_3px_0_black]">
              <Loader size="xs" color="black" variant="dots" />
            </Box>
          )}
        </Stack>
      </ScrollArea>

      <Box className="p-4 border-t-4 border-black bg-[var(--color-surface)]">
        <Group gap="xs">
          <input 
            className="flex-1 bg-white border-2 border-black p-3 text-[13px] font-bold outline-none focus:translate-x-[-1px] transition-all shadow-[2px_2px_0_black]"
            placeholder="Search your soul..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <ActionIcon 
            onClick={handleSend}
            variant="filled" 
            color="black" 
            size={46} 
            className={`rounded-none border-2 border-black shadow-[3px_3px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${isLoading ? 'opacity-50' : ''}`}
            disabled={isLoading || !input.trim()}
          >
            <IconSend className="text-white w-5 h-5" />
          </ActionIcon>
        </Group>
      </Box>
    </Box>
  );
};

export default QuoteChat;
