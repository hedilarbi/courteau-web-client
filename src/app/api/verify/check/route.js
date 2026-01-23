import { NextResponse } from "next/server";

const TWILIO_BASE_URL =
  process.env.TWILIO_BASE_URL || process.env.NEXT_PUBLIC_TWILIO_BASE_URL;

export async function POST(request) {
  if (!TWILIO_BASE_URL) {
    return NextResponse.json(
      { success: false, message: "TWILIO_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    const twilioResponse = await fetch(`${TWILIO_BASE_URL}/check-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await twilioResponse.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = {
          success: false,
          message: "Invalid response from verify service",
        };
      }
    }

    return NextResponse.json(data, { status: twilioResponse.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to reach verify service" },
      { status: 502 }
    );
  }
}
