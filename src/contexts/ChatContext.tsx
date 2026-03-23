"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface QuestionContext {
  questionId?: string;
  content: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string | null;
  category: string;
  knowledgePoints: { title: string; description: string }[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface ChatContextValue {
  isOpen: boolean;
  questionContext: QuestionContext | null;
  messages: ChatMessage[];
  openChat: (context?: QuestionContext) => void;
  closeChat: () => void;
  clearMessages: () => void;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [questionContext, setQuestionContext] = useState<QuestionContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("anatomy-ai-chat-messages");
      if (savedMessages) setMessages(JSON.parse(savedMessages));
      
      const savedContext = localStorage.getItem("anatomy-ai-chat-context");
      if (savedContext) setQuestionContext(JSON.parse(savedContext));
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem("anatomy-ai-chat-messages", JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat messages:", error);
    }
  }, [messages, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      if (questionContext) {
        localStorage.setItem("anatomy-ai-chat-context", JSON.stringify(questionContext));
      } else {
        localStorage.removeItem("anatomy-ai-chat-context");
      }
    } catch (error) {
      console.error("Failed to save chat context:", error);
    }
  }, [questionContext, isInitialized]);

  const openChat = useCallback((context?: QuestionContext) => {
    setQuestionContext((prev) => {
      if (context) {
        if (prev?.questionId !== context.questionId) {
          setMessages([]);
        }
        return context;
      }
      return prev;
    });
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return [...prev.slice(0, -1), { ...last, content }];
      }
      return [...prev, { role: "assistant", content }];
    });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        questionContext,
        messages,
        openChat,
        closeChat,
        clearMessages,
        addMessage,
        updateLastAssistantMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
