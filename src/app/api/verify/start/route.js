import { NextResponse } from "next/server";

const TWILIO_BASE_URL =
  process.env.TWILIO_BASE_URL || process.env.NEXT_PUBLIC_TWILIO_BASE_URL;

export async function POST(request) {
  if (!TWILIO_BASE_URL) {
    return NextResponse.json(
      { success: false, message: "TWILIO_BASE_URL n'est pas configurée." },
      { status: 500 }
    );
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Corps JSON invalide." },
      { status: 400 }
    );
  }

  try {
    const twilioResponse = await fetch(`${TWILIO_BASE_URL}/start-verify`, {
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
          message: "Réponse invalide du service de vérification.",
        };
      }
    }

    return NextResponse.json(data, { status: twilioResponse.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Impossible de joindre le service de vérification." },
      { status: 502 }
    );
  }
}
