"use client";
import { Card } from "@/components/ui/card";
import { type CreateMessage } from "ai";
import { useState } from "react";
import { LawQueryService } from "@/lib/services/queryLaws";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconArrowUp } from "@/components/ui/icons";
import Link from "next/link";
import AboutCard from "@/components/cards/aboutcard";
import ReactMarkdown from "react-markdown";
import { LoadingMessage } from "@/components/ui/loadingMessage";
export default function Chat() {
  const [messages, setMessages] = useState<CreateMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    


    setIsLoading(true);
    const newMessages: CreateMessage[] = [
      ...messages,
      { content: input, role: "user" },
      { content: "", role: "assistant" }
    ];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch('/api/query', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

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
            console.error('Parse error:', parseError);
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          role: "assistant",
          content: "I couldn't find relevant information for your question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

    return (
      <div className="group w-full overflow-auto ">
        {messages.length <= 0 ? (
          <AboutCard />
        ) : (
          <div className="max-w-xl mx-auto mt-10 mb-24">
            {messages.map((message, index) => (
              <div key={index} className="whitespace-pre-wrap flex mb-5">
                <div
                  className={`${
                    message.role === "user"
                      ? "bg-slate-200 ml-auto"
                      : "bg-transparent"
                  } p-2 rounded-lg`}
                >
                  {message.role === "assistant" ? (
                    message.content?(
                    <ReactMarkdown>
                      { message.content}
                    </ReactMarkdown>
                  ) : (
                   isLoading  && <LoadingMessage />
                  )
                  ):(
                    <>{message.content}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="fixed inset-x-0 bottom-10 w-full ">
          <div className="w-full max-w-xl mx-auto">
            <Card className="p-2">
              <form onSubmit={handleSubmit}>
                <div className="flex">
                  <Input
                    type="text"
                    value={input}
                    onChange={(event) => {
                      setInput(event.target.value);
                    }}
                    className="w-[95%] mr-2 border-0 ring-offset-0 focus-visible:ring-0 focus-visible:outline-none focus:outline-none focus:ring-0 ring-0 focus-visible:border-none border-transparent focus:border-transparent focus-visible:ring-none"
                    placeholder="Ask me anything..."
                  />
                  <Button disabled={!input.trim()}>
                    <IconArrowUp />
                  </Button>
                </div>
                {messages.length > 1 && (
                  <div className="text-center">
                    <Link href="/genui" className="text-xs text-blue-400">
                      Try GenUI and streaming components &rarr;
                    </Link>
                  </div>
                )}
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
}