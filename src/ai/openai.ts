import OpenAI from "openai";
import Constants from "expo-constants";


type Extra = Record<string, any>;

function getExtra(): Extra {
    // Works across SDK versions
    return (
        (Constants.expoConfig?.extra as Extra) ||
        ((Constants as any).manifest?.extra as Extra) ||
        ((Constants as any).manifest2?.extra?.extra as Extra) ||
        {}
    );
}

function env(key: string): string | undefined {
    const extra = getExtra();
    return (
        // Prefer app.config.js injected values
        extra?.[key] ??
        // Fallbacks if needed
        process.env[`EXPO_PUBLIC_${key}`] ??
        process.env[key]
    );
}


const openai = new OpenAI({
    apiKey: env("AI_FORMS_1"),
    dangerouslyAllowBrowser: true  // TODO: create a proper back-end
});

const basePrompt = [
    {
        role: "system",
        content: `
You are a copywriter with 10 years of experience.

Your goal is to create a compelling description for a crowd lending request.

Focus on:
- community impact
- the relationship between the business and local customers
- emotional storytelling
- clarity and trust

Write in a persuasive but authentic tone.
The result will be in plain text with no formatting.
`
    }
];


const tones = [
    "marketing consultant",
    "analytical",
    "passionate and community-focused"
];

export async function refineDescription(userInput: string): Promise<string> {
    const tone = tones[0];

    const response = await openai.responses.create({
        model: "gpt-4.1", // or "gpt-5" as per your snippet
        input: [
            ...basePrompt, // Spread the static system item
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: `Context: ${userInput}\n\nTone: ${tone}\n\nWrite the crowdfunding description.`
                    }
                ]
            }
        ]
    });

    // Accessing the output via the specific property for this API version
    return response.output_text || "";
}