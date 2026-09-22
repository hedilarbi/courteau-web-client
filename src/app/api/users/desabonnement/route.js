import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.lecourteau.com/api";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const response = await fetch(`${API_URL}/users/desabonnement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Le désabonnement a échoué." },
      { status: 500 },
    );
  }
}
