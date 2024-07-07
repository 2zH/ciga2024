import { NextResponse } from "next/server";

type ResponseData = {
  message: string
}

export async function GET(Request: Request) {
  return NextResponse.json({ message: 'Hello world!' });
}