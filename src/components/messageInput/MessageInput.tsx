import { Input } from "@/components/ui/input";
import { IconArrowUp } from "../ui/icons";
import { Button } from "../ui/button";
import styles from "./MessageInput.module.css";
import { useState } from "react";

interface Props {
  handleSubmit: (e: React.FormEvent) => void;
  isLoadingResponse?: boolean;
  isLoadingFetchingMessages?: boolean;
  setInputValue: (query: string) => void;
  inputValue: string;
}
const MessageInput = ({
  inputValue,
  setInputValue,
  isLoadingResponse = false,
  isLoadingFetchingMessages = false,
  handleSubmit,
}: Props) => {
  const [textareaHeight, setTextareaHeight] = useState<string>("40px");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputValue(e.target.value);
    textarea.style.height = "auto";

    const newHeight = Math.min(textarea.scrollHeight, 200);
    setTextareaHeight(`${newHeight}px`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
    setTextareaHeight("40px");
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex">
        <Input
          style={{
            height: textareaHeight,
            minHeight: textareaHeight,
            maxHeight: "200px",
          }}
          value={inputValue}
          onChange={handleInputChange}
          className={styles.input}
          placeholder="Stellen Sie mir eine Frage zu den Gesetzen in Deutschland ..."
        />
        <Button
          disabled={
            !inputValue.trim() || isLoadingResponse || isLoadingFetchingMessages
          }
        >
          <IconArrowUp />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
