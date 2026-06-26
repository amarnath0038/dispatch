import {
    telegramMessageOptions,
    telegramMessageOptionsSchema,
    telegramMessageOutput,
    telegramMessageOutputSchema,
    telegramMessageRequestSchema,
    telegramMessageResponseSchema
} from "./schemas";

export const sendTelegramMessage = async (
    input: telegramMessageOptions
): Promise<telegramMessageOutput> => {
    const parsedInput = telegramMessageOptionsSchema.parse(input);

    const requestBody = telegramMessageRequestSchema.parse({
        chat_id: parsedInput.chatId,
        text: parsedInput.message
    });

    const response = await fetch(
        `https://api.telegram.org/bot${parsedInput.botToken}/sendMessage`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        }
    );

    const json = await response.json();
    const data = telegramMessageResponseSchema.parse(json)

    if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.description ?? "Telegram request failed!")
    }

    return telegramMessageOutputSchema.parse({
        ok: true,
        chatId: parsedInput.chatId,
        messageId: data.result.message_id
    });
};