import { Command } from "commander";

const program = new Command();

type TelegramResponse = {
    ok: boolean,
    result?: {
        message_id?: string
    },
    description?: string
}

program
    .name("dispatch")
    .description("A CLI tool for managing your Telegram bot")
    .command("telegram")
    .description("Send a Telegram message")
    .argument("<chatId>", "The chat ID to send the message to")
    .argument("<message>", "The message to send")
    .action(async (chatId: string, message: string) => {

        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            console.log("Missing TELEGRAM_BOT_TOKEN env variable");
            process.exit(1);
        }

        if (!chatId) {
            console.log("Missing telegram chatId");
            process.exit(1);
        }

        if (!message) {
            console.log("Missing telegram text message");
            process.exit(1);
        }

        const response = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                })
            }
        )  
        const data = (await response.json()) as TelegramResponse;
        
        if (!response.ok || !data.ok) {
            const why = data.description || response.statusText;
            console.log(`Telegram API request failed: ${why}`)
            process.exit(1);
        }

        const messageId = data.result?.message_id;
        console.log(`Telegram message sent successfully to chat: ${chatId}`);

        if (messageId !== undefined) {
            console.log(`Telegram message ID: ${messageId}`)
        }

    });

program.parseAsync(process.argv).catch((err: any) => {
    console.log(err);
    process.exit(1);
});

// URL to check for chatId:  https://api.telegram.org/bot/<YOUR_TOKEN>/getUpdates