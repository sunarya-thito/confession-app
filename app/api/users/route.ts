import {cookies} from "next/headers";
import {nanoid} from "nanoid";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  let userId = cookieStore.get('userId')?.value;
  if (!userId) {
    userId = nanoid()

    cookieStore.set('userId', userId, {
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 tahun
      path: '/',
      sameSite: 'strict'
    })
  }

  return NextResponse.json({
    userId
  });
}