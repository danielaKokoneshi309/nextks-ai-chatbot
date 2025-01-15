import { NextResponse } from 'next/server';
import { LawQueryService } from '@/lib/services/queryLaws';

export async function PUT(req: Request) {
  try {
    const { query } = await req.json();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = LawQueryService.QueryLaws(query);
          for await (const chunk of generator) {
            if (chunk.queryResult) {
              controller.enqueue(JSON.stringify({ queryResult: chunk.queryResult }) + '\n');
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json({ error: 'I apologize, but I am currently experiencing high demand. Please try again in a few moments or rephrase your question to be more specific.'  }, { status: 500 });
  }
} 