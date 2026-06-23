import { Command } from "commander";
const program = new Command();
program
    .name("dispatch")
    .description("A CLI tool for managing your Telegram bot")
    .command("telegram")
    .description("Send a Telegram message")
    .argument("<chatId>", "The chat ID to send the message to")
    .argument("<message>", "The message to send")
    .action(async (chatId, message) => {
    console.log(`Sending message to chat ID ${chatId}: ${message}`);
    process.exit(1);
});
program.parseAsync(process.argv);
