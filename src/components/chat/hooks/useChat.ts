import { useState, useEffect, useCallback } from "react";
import { api_routes } from "../../../constants/routes";
import useMessages from ".././hooks/useMessages";
import { type CreateMessage } from "ai";
import { chatStore } from "@/store/chatStore";
import { useParams } from "next/navigation";

export function useChat() {
  const [messages, setMessages] = useState<CreateMessage[]>([]);
  const [isLoadingResponse, setIsLoadingResponse] = useState<boolean>(false);
  const { inputValue, setInputValue } = chatStore();
  const { sessionId } = useParams();

  const { saveMessage } = useMessages();

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoadingResponse) return;
    setIsLoadingResponse(true);

    const newMessages: CreateMessage[] = [
      ...messages,
      { content: inputValue, role: "user" },
      { content: "", role: "assistant" },
    ];
    setMessages(newMessages);

    const currentSessionId = sessionId as string;

    await saveMessage(inputValue, "user", currentSessionId);
    setInputValue("");

    try {
      const response = await fetch(api_routes.QUERY, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: inputValue,
          sessionId: currentSessionId,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.queryResult) {
              accumulatedResponse += parsed.queryResult;
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1] = {
                  role: "assistant",
                  content: accumulatedResponse,
                };
                return updatedMessages;
              });
            }
          } catch (parseError) {
            continue;
          }
        }
      }

      await saveMessage(accumulatedResponse, "assistant", currentSessionId);
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          role: "assistant",
          content: "I couldn't find relevant information for your question.",
        },
      ]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isLoadingResponse,
    handleSubmit,
    setMessages,
  };
}
