"use client";
import { Card } from "@/components/ui/card";
import styles from "./ChatSession.module.css";
import MessageInput from "../messageInput/MessageInput";
import MessageList from "../messageList/MessageList";
import { useChat } from "./hooks/useChat";
import { chatStore } from "@/store/chatStore";
import { useEffect, useRef } from "react";
import useMessages from "./hooks/useMessages";
import { useParams } from "next/navigation";
import { formatMessages } from "./helpers/formatMessages";

export default function ChatSession() {
  const { messages, handleSubmit, isLoadingResponse, setMessages } = useChat();
  const { fetchMessages, isLoadingFetchingMessages } = useMessages();
  const { inputValue, setInputValue } = chatStore();

  const params = useParams();
  const isFirstRender = useRef(true);
  const isFirstMessage = useRef(true);

  useEffect(() => {
    const handleFetchMessages = async () => {
      try {
        const storedMessages = await fetchMessages(params.sessionId as string);
        const formattedMessages = formatMessages(storedMessages);
        if (formattedMessages.length > 0) {
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (isFirstRender.current) {
      handleFetchMessages();
      isFirstRender.current = false;
    }
  }, [params.sessionId, fetchMessages, setMessages]);

  useEffect(() => {
    if (isFirstMessage.current) {
      handleSubmit();
      isFirstMessage.current = false;
    }
  }, [handleSubmit]);

  return (
    <div
      className={`${styles.container} ${
        messages.length > 0 && styles.conversationStarted
      }`}
    >
      <MessageList
        isLoadingResponse={isLoadingResponse}
        isLoadingFetchingMessages={isLoadingFetchingMessages}
        messages={messages}
      />
      <div
        className={`${styles.inputContainer}
        ${messages.length > 0 && styles.conversationStarted}
        `}
      >
        <div className={styles.inputWrapper}>
          <Card className="p-2">
            <MessageInput
              isLoadingResponse={isLoadingResponse}
              isLoadingFetchingMessages={isLoadingFetchingMessages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSubmit={handleSubmit}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
