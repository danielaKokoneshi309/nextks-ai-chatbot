import { error_messages } from "@/constants/error-messages";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { content, role, sessionId } = await req.json();

    const newMessage = await prisma.message.create({
      data: {
        content,
        role,
        sessionId,
      },
    });

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    return NextResponse.json(
      { error: error_messages.FAILED_TO_SAVE },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: error_messages.SESSION_ID_REQUIRED },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        sessionId: sessionId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: error_messages.FAILED_TO_FETCH },
      { status: 500 }
    );
  }
}
