import { Document } from '@langchain/core/documents';
import { SelfQueryRetriever } from 'langchain/retrievers/self_query';
import { WeaviateTranslator } from '@langchain/weaviate';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createChatInstanceToParseJson, createOpenAIInstance } from '../openai-config';
import getVectorStore from '../vectorestore';
import { QueryResult } from '../../types/companies';

export class LawQueryService {
  private static formatDocs(docs: Document[]) {
    const groupedDocs = docs.reduce((acc, doc) => {
      const reportType = doc.metadata.report_type;
      if (!acc[reportType]) {
        acc[reportType] = [];
      }
      acc[reportType].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);

    return Object.entries(groupedDocs).flatMap(([reportType, documentsGrouped]) =>
      documentsGrouped.map((doc) => ({
        reportType,
        document: JSON.stringify(doc),
      })),
    );
  }

  private static async createRetriever() {
    return SelfQueryRetriever.fromLLM({
      llm: createOpenAIInstance(),
      vectorStore: await getVectorStore(),
      documentContents: 'Laws',
      structuredQueryTranslator: new WeaviateTranslator(),
      attributeInfo: [
        { name: 'abbreviation', type: 'string', description: 'Abbreviation of the parsed law' },
        { name: 'title', type: 'string', description: 'Title of the parsed law' },
        { name: 'text', type: 'string', description: 'Text of the  law' },
        { name: 'seq', type: 'number', description: 'Sequence number of the law' },
      ],
      searchParams: {
        k: 20,
      }
    });
  }

  public static async QueryLaws( query: string): Promise<QueryResult[]> {
    const llm = createOpenAIInstance();
    const structuredLlm = createChatInstanceToParseJson();
    const retriever = await this.createRetriever();
    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a legal assistant. Answer the question based on the provided legal documents.
      If you're unsure or the information isn't in the documents, say so.
      Always cite your sources.

      Context: {context}
      Question: {question}

      Answer in a clear, professional manner. Include relevant legal citations.
      `);

    const ragChain = RunnableSequence.from([
      {
        context: retriever.pipe(this.formatDocs),
        question: new RunnablePassthrough(),
      },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const results = await ragChain.invoke(query);
    const structured = await structuredLlm.invoke(results);
    return structured.results || [];
  }
}