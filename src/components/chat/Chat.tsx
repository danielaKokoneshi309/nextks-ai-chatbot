"use client";
import { Card } from "@/components/ui/card";
import AskCard from ".././cards/askcard";
import styles from "./Chat.module.css";
import MessageInput from ".././messageInput/MessageInput";
import CommonQuestions from "../commonQuestions/CommonQuestions";
import { chatStore } from "../../store/chatStore";
import useSessions from "./hooks/useSessions";
export default function Chat() {
  const { setInputValue, inputValue } = chatStore();
  const { createSession } = useSessions();

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
  };
  return (
    <div className={styles.container}>
      <div>
        <AskCard />
      </div>
      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <Card className="p-2">
            <MessageInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              handleSubmit={async () => {
                await createSession();
              }}
            />
          </Card>
          <CommonQuestions handleQuestionClick={handleQuestionClick} />
        </div>
      </div>
    </div>
  );
}
