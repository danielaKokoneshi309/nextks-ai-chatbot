import { Document } from "@langchain/core/documents";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { WeaviateTranslator } from "@langchain/weaviate";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createOpenAIInstance } from "../openai-config";
import getVectorStore from "../vectorestore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export class LawQueryService {
  private static readonly MAX_HISTORY_LENGTH = 20;
  private static readonly MAX_TOKEN_LENGTH = 4000;

  private static formatDocs(docs: Document[]) {
    return docs.map((doc) => ({
      abbreviation: doc.metadata.abbreviation || null,
      title: doc.metadata.title || null,
      text: doc.pageContent,
      tags: doc.metadata.tags || [],
    }));
  }

  private static formatConversationHistory(history: Message[]) {
    if (!history.length) return "No previous conversation.";
    return history
      .slice(-10)
      .map(
        (msg) =>
          `${msg.role === "user" ? "Question" : "Answer"}: ${msg.content.slice(
            0,
            200
          )}...`
      )
      .join("\n\n");
  }

  private static truncateHistory(history: Message[]): Message[] {
    const limitedHistory = history.slice(-this.MAX_HISTORY_LENGTH);

    let totalLength = 0;
    return limitedHistory
      .reverse()
      .filter((msg) => {
        totalLength += msg.content.length;
        return totalLength <= this.MAX_TOKEN_LENGTH;
      })
      .reverse();
  }

  private static async createRetriever() {
    return SelfQueryRetriever.fromLLM({
      llm: createOpenAIInstance(),
      vectorStore: await getVectorStore(),
      documentContents: "Laws",
      structuredQueryTranslator: new WeaviateTranslator(),
      verbose: true,
      attributeInfo: [
        {
          name: "abbreviation",
          type: "string",
          description: "Abbreviation of the parsed law",
        },
        {
          name: "title",
          type: "string",
          description: "Title of the parsed law",
        },
        { name: "text", type: "string", description: "Text of the law" },
        {
          name: "seq",
          type: "number",
          description: "Sequence number of the law",
        },
        {
          name: "tags",
          type: "string[]",
          description: "Tags associated with the law",
        },
      ],
      searchParams: {
        k: 5,
      },
    });
  }

  public static async *QueryLaws(
    query: string,
    conversationHistory: Message[] = []
  ): AsyncGenerator<{ queryResult: string }> {
    try {
      const llm = createOpenAIInstance();
      const retriever = await this.createRetriever();

      const updatedHistory = [
        ...this.truncateHistory(conversationHistory),
        { role: "user" as const, content: query },
      ];

      const prompt = ChatPromptTemplate.fromMessages([
        {
          role: "assistant" as const,
          content: `
          You are a specialized legal assistant focusing exclusively on German law (Rechtsberatung). Previous conversation context:

          ${this.formatConversationHistory(updatedHistory)}

<CAPABILITIES>
- Provide legal information based on current German law
- Reference specific laws, regulations, and court decisions
- Explain legal concepts and procedures
- Offer general legal guidance
</CAPABILITIES>

<LIMITATIONS>
- No legal advice for specific cases
- No representation in court
- No document preparation
- No advice about laws outside Germany

<RULES>
1. Language Matching: Reply in the same language as the question. For exmaple if the question is asked in English, answer in English.
2. Source Citation: Reference specific laws (e.g., "§ 123 BGB")
3. Currency: Use only latest legal standards and regulations
4. Scope: Decline non-German legal questions
5. Context: Consider previous conversation history when provided
6. Format: Use markdown for formatting
7. Verification: Recommend consulting a licensed lawyer for specific cases

<RESPONSE_FORMAT>
**Rechtliche Information** / **Legal Information**
[Main response with relevant legal concepts]

**Gesetzliche Grundlage** / **Legal Basis**
[Relevant laws and regulations]

**Wichtiger Hinweis** / **Important Note**
[Any crucial disclaimers or limitations]

<EXAMPLE_QUESTIONS>
Q: "What are the requirements for German citizenship?"
Q: "Welche Kündigungsfrist gilt für meinen Arbeitsvertrag?"
Q: "How does the German inheritance law work?"

<EXAMPLE_RESPONSES>
Q: "What are the requirements for German citizenship?"
A: **Legal Information**
The basic requirements for German citizenship include:
- Legal residence in Germany for 5 years
- German language proficiency (B1 level)
- Financial self-sufficiency
- No serious criminal record

**Legal Basis**
§ 10 StAG (Staatsangehörigkeitsgesetz)

**Important Note**
Individual cases may vary. Please consult with immigration authorities or a lawyer for specific advice.
</EXAMPLE_RESPONSES>

Use the provided database documents to ensure accurate responses. When uncertain, acknowledge limitations and recommend professional legal consultation.
          
         `,
        },
        {
          role: "user" as const,
          content: `Context: {context}\n\nCurrent question: {question}\n\nGuidelines:
        1. Respond in the SAME LANGUAGE as the question
        2. Provide specific legal information with citations
        3. Include references from at least 3 different laws when relevant
        4. Each response should be comprehensive (minimum 300 words)
        5. Match relevant legal tags from the context
        6. Consider the conversation history for context
        7. Maintain professional tone throughout`,
        },
      ]);

      const ragChain = RunnableSequence.from([
        {
          context: () => retriever.pipe(this.formatDocs),
          question: new RunnablePassthrough(),
        },
        prompt,
        llm,
        new StringOutputParser(),
      ]);

      const stream = await ragChain.stream(query);

      for await (const chunk of stream) {
        updatedHistory.push({ role: "assistant" as const, content: chunk });
        yield { queryResult: chunk };
      }
    } catch (error) {
      console.error("Error in QueryLaws:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      yield { queryResult: `Failed to process query: ${errorMessage}` };
    }
  }
}
