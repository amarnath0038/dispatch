import { Command } from "commander";
import { sendTelegramMessage } from "dispatch-core"

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

        try {
            const result = await sendTelegramMessage({
                botToken: token,
                chatId,
                message
            });

            console.log(`Telegram message successfully sent to chat ${chatId}`);
            console.log(`Telegram message: ${message}`);

        } catch (err) {
            const why = err instanceof Error ? err.message : String(err);
            console.error(`Telegram request failed: ${why}`);
            process.exit(1);
        }
    });

program.parseAsync(process.argv).catch((err: any) => {
    console.log(err);
    process.exit(1);
});

// URL to check for chatId:  https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates