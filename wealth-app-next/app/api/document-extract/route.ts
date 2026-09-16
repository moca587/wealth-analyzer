import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, pdfBase64 } = await request.json();

    const extractionPrompt = `
You extract financial information from documents.

Return ONLY valid JSON.
Do not use markdown code fences.

Use exactly these property names and this structure:

{
  "household": [
    {
      "role": "client",
      "first": null,
      "last": null,
      "dob": null,
      "street": null,
      "apt": null,
      "city": null,
      "state": null,
      "postal": null,
      "country": null,
      "relationship": null,
      "riskTolerance": null,
      "timeHorizon": null,
      "confidence": null,
      "sourceQuote": null
    }
  ],

  "income": [
    {
      "who": null,
      "primary": null,
      "secondary": null,
      "raisePct": null,
      "confidence": null,
      "sourceQuote": null
    }
  ],

  "expenses": {
    "living": null,
    "insurance": null,
    "other": null,
    "annualSavings": null,
    "inflationPct": null,
    "confidence": null,
    "sourceQuote": null
  },

  "assets": [
    {
      "label": null,
      "accountTypeHint": null,
      "value": null,
      "country": null,
      "ccy": null,
      "propertyValue": null,
      "otherValue": null,
      "confidence": null,
      "sourceQuote": null
    }
  ],

  "liabilities": [
    {
      "type": null,
      "label": null,
      "balance": null,
      "ratePct": null,
      "years": null,
      "confidence": null,
      "sourceQuote": null
    }
  ],

  "goals": [
    {
      "name": null,
      "amount": null,
      "homePrice": null,
      "startYear": null,
      "endYear": null,
      "category": null,
      "tier": null,
      "confidence": null,
      "sourceQuote": null
    }
  ],

  "holdings": [
    {
      "name": null,
      "tkr": null,
      "val": null,
      "type": null,
      "cls": null,
      "region": null,
      "er": null,
      "yld": null,
      "note": null,
      "confidence": null,
      "sourceQuote": null
    }
  ],

  "retirement": {
    "desiredAnnualSpend": null,
    "client1RetirementAge": null,
    "client2RetirementAge": null,
    "client1PensionAnnual": null,
    "client1PensionStartAge": null,
    "client2PensionAnnual": null,
    "client2PensionStartAge": null,
    "confidence": null,
    "sourceQuote": null
  }
}

Rules:
- Use the exact property names shown above.
- Do not rename properties.
- Use numbers for monetary values and percentages, without currency symbols or commas.
- Use null when the document does not provide a value.
- riskTolerance should be one of: "conservative", "moderate", "aggressive", or null.
- country and currency codes should use uppercase codes when known.
- For holdings, use "tkr" for ticker and "val" for market value.
- sourceQuote should contain the relevant text from the document when possible.
- confidence should be a number from 0 to 1.
- Never invent or estimate financial values that are not stated in the document.
`;

    const content = pdfBase64
      ? [
          {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: "application/pdf" as const,
              data: pdfBase64,
            },
          },
          {
            type: "text" as const,
            text: extractionPrompt,
          },
        ]
      : [
          {
            type: "text" as const,
            text: `${extractionPrompt}

Document:
${text}`,
          },
        ];

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 6000,
      messages: [
        {
          role: "user",
          content,
        },
      ],
    });

    const block = message.content.find((item) => item.type === "text");

    if (!block || block.type !== "text") {
      throw new Error("Claude returned no text.");
    }

    console.log("Claude raw response:", block.text);

    const cleaned = block.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();

    const extracted = JSON.parse(cleaned);

    return NextResponse.json(extracted);
  } catch (error) {
    console.error("Document extraction failed:", error);

    return NextResponse.json(
      { error: "Document extraction failed." },
      { status: 500 },
    );
  }
}
