import { NextResponse } from "next/server";
import { LawQueryService } from "@/lib/services/queryLaws";
import { error_messages } from "../../../constants/error-messages";

export async function PUT(req: Request) {
  try {
    const { query, conversationHistory } = await req.json();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = LawQueryService.QueryLaws(
            query,
            conversationHistory
          );
          for await (const chunk of generator) {
            if (chunk.queryResult) {
              controller.enqueue(
                JSON.stringify({ queryResult: chunk.queryResult }) + "\n"
              );
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
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      {
        error: error_messages.HIGH_DEMAND,
      },
      { status: 500 }
    );
  }
}
