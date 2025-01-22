import { api_routes } from "../../../constants/routes";
import { useState } from "react";

const useMessages = () => {
  const [isLoadingFetchingMessages, setIsLoadingFetchingMessages] =
    useState<boolean>(false);

  const fetchMessages = async (sessionId: string) => {
    try {
      setIsLoadingFetchingMessages(true);
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      const data = await response.json();
      setIsLoadingFetchingMessages(false);
      return data.messages || [];
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const saveMessage = async (
    content: string,
    role: "user" | "assistant",
    activeSessionId: string
  ) => {
    if (!activeSessionId) return;

    try {
      await fetch(api_routes.MESSAGES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          role,
          sessionId: activeSessionId,
        }),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  return {
    fetchMessages,
    saveMessage,
    isLoadingFetchingMessages,
    setIsLoadingFetchingMessages,
  };
};

export default useMessages;
