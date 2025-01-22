import ReactMarkdown from "react-markdown";
import styles from "./MessageList.module.css";
import { LoadingMessage, LoadingSpinner } from "../ui/loadingMessage";
import { roles } from "@/constants/roles";

interface Message {
  role: string;
  content: string;
}

interface Props {
  messages: Message[];
  isLoadingResponse: boolean;
  isLoadingFetchingMessages: boolean;
}

const MessageList = ({
  messages = [],
  isLoadingResponse,
  isLoadingFetchingMessages,
}: Props) => {
  if (isLoadingFetchingMessages) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.messageContainer}>
      {messages.map((message, index) => (
        <div key={index} className={styles.messageWrapper}>
          <div
            className={`${styles.message} ${
              message.role === roles.USER ? styles.userMessage : ""
            }`}
          >
            {message.role === roles.ASSISTANT ? (
              message.content ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                isLoadingResponse && <LoadingMessage />
              )
            ) : (
              <>{message.content}</>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
