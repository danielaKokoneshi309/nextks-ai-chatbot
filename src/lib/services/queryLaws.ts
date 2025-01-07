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
    return docs.map(doc => ({
      abbreviation: doc.metadata.abbreviation || null,
      text: doc.pageContent,
    }));
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
        k:5,
      }
    });
  }

  public static async QueryLaws( query: string): Promise<QueryResult[]> {
    const llm = createOpenAIInstance();
    const structuredLlm = createChatInstanceToParseJson();
    const retriever = await this.createRetriever();
    const docs =await retriever._getRelevantDocuments(query);
    const formattedDocs = this.formatDocs(docs);
 
      const context = formattedDocs
        .map(doc => `Title: ${doc.abbreviation}\nText: ${doc.text}`)
        .join('\n\n');
      console.log(context);
    const prompt = ChatPromptTemplate.fromTemplate(`
      You are a legal assistant.Answer the question based on the provided legal documents.
      The answer should be in the language of the question.
      The answer should be detailed and comprehensive with a minium of 200 words.
      If you're unsure or the information isn't in the documents, say so.

      Context: {context}
      Question: {question}

      Answer in a clear, professional manner. Include relevant legal citations.
      `);

    const ragChain = RunnableSequence.from([
      {
        context:()=> context,
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