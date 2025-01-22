import { create } from "zustand";
import { type CreateMessage } from "ai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatStore {
  messages: CreateMessage[];
  inputValue: string;

  setMessages: (messages: CreateMessage[]) => void;
  setInputValue: (value: string) => void;
}

export const chatStore = create<ChatStore>((set) => ({
  messages: [],
  inputValue: "",

  setMessages: (newMessages) => set({ messages: newMessages }),
  setInputValue: (value) => set({ inputValue: value }),
}));
