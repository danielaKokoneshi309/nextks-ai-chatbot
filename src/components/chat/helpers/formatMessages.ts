export const formatMessages = (fetchedMessages: object[]) => {
  return fetchedMessages.map((msg: any) => ({
    content: msg.content || "",
    role: msg.role as "user" | "assistant",
  }));
};
