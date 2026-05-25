import { env } from "../../utils/env";

export async function sendOtpEmail(email: string, code: string) {
  if (!env.MAILJET_API_KEY || !env.MAILJET_API_SECRET || !env.MAILJET_FROM_EMAIL) {
    throw new Error("Mail service is not configured");
  }

  const auth = Buffer.from(`${env.MAILJET_API_KEY}:${env.MAILJET_API_SECRET}`).toString("base64");
  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: env.MAILJET_FROM_EMAIL,
            Name: env.MAILJET_FROM_NAME,
          },
          To: [{ Email: email }],
          Subject: "Your Vouch OTP Code",
          TextPart: `Your OTP code is ${code}. It expires in 10 minutes.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send OTP email (${response.status})`);
  }
}
