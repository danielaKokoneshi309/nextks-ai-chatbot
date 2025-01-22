import { error_messages } from "@/constants/error-messages";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const { query, sessionId, conversationHistory } = await request.json();

    let session;
    if (!sessionId) {
      session = await prisma.session.create({
        data: {},
      });
    } else {
      session = { id: sessionId };
    }

    await prisma.message.create({
      data: {
        sessionId: session.id,
        content: query,
        role: "user",
      },
    });

    const response = await fetch("http://localhost:3000/api/query", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(error_messages.FAILED_FETCH_RESPONSE);
    }

    return NextResponse.json({
      sessionId: session.id,
      response: await response.text(),
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: error_messages.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
