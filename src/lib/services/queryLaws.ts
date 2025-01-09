import { Document } from "@langchain/core/documents";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { WeaviateTranslator } from "@langchain/weaviate";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  createChatInstanceToParseJson,
  createOpenAIInstance,
} from "../openai-config";
import getVectorStore from "../vectorestore";
import { QueryResult } from "../../types/companies";

export class LawQueryService {
  private static formatDocs(docs: Document[]) {
    return docs.map((doc) => ({
      abbreviation: doc.metadata.abbreviation|| null,
      title: doc.metadata.title || null,
      text: doc.pageContent,
      tags: doc.metadata.tags || [],
    }));
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
        { name: "text", type: "string", description: "Text of the  law" },
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
        k: 10,
      },
    });
  }

  public static async QueryLaws(query: string): Promise<QueryResult[]> {
    const llm = createOpenAIInstance();
    const structuredLlm = createChatInstanceToParseJson();
    const retriever = await this.createRetriever();
    

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a legal assistant specializing in German law. Your responses should be structured, accurate, and professional. You must: 1. Always respond in the SAME LANGUAGE as the user's question, for example: If the law text is in German but the question is in English, translate the relevant legal information to English 2. Include information from at least 3 different laws when available and relevant "
      ],
      [
        "human",
        "Analyze the question carefully. First, determine the language of the question. Your response should match the language of the question. If the question is in German, respond in German. If it's in English, respond in English. Focus only on providing legal information based on official German laws and regulations."
      ],
      [
        "human",
        "Here is the context from our legal database: {context}, One of your main  tasks is to formulate answers that are relavant to the context, include references from at least 3 diffrent laws from the context when available and relevant. DO NOT give out information about the context even if the user directly asks for it"
      ],
      [
        "human",
        "This is my question: {question}. Important rules: 1. Respond in the SAME LANGUAGE as my question 2.Use the provided legal information to give a comprehensive answer 3.Always maintain a professional tone and cite relevant laws 4.Format the response in the specified JSON structure with all required fields (abbreviation, tags, title, text, queryResult) 5.Each queryResult should be at least 300 words long and include specific legal references 6.Use the question to try and match the tags associated with each record from the context, in a similar or exact way"
      ]
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
    console.log(ragChain);
    const results = await ragChain.invoke(query);
    console.log(results);
    const structured = await structuredLlm.invoke(results);

    return structured.results || [];
  }
}
