#!/usr/bin/env node

import { Command } from "commander";
import { z } from "zod";
import { sendTelegramMessage } from "@amarnath00/dispatch-core";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const program = new Command();

const configPath = join(homedir(), ".config", "dispatch", "config.json");

const cliConfigSchema = z.object({
    telegramBotToken: z.string().min(1).optional(),
});

const writeTelegramBotToken = (token: string) => {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, `${JSON.stringify({ telegramBotToken: token }, null, 2)}\n`, {
        mode: 0o600,
    });
};

const getTelegramBotToken = () => {
    if (!existsSync(configPath)) {
        throw new Error("Telegram bot token is required. Run `dispatch init` ");
    }

    const config = cliConfigSchema.parse(JSON.parse(readFileSync(configPath, "utf-8")));
    const token = config.telegramBotToken;
    if (!token) {
        throw new Error("Telegram bot token is required. Run `dispatch init` ");
    }
    return token;
};

program.name("dispatch").description("A CLI tool for managing your Telegram bot");

program
    .command("init")
    .description("Configure Dispatch CLI local settings")
    // Multi-word options like --template-engine are normalised to camelCase. Thats's why we can access telegramBotToken [:from docs]
    .requiredOption("--telegram-bot-token <botToken>", "Telegram bot token")
    .action(async (options: { telegramBotToken: string }) => {
        writeTelegramBotToken(options.telegramBotToken);
        console.log(`Saved Dispatch CLI config to ${configPath}`);
    });
program
    .command("telegram")
    .description("Send a Telegram message")
    .argument("<chatId>", "The chat ID to send the message to")
    .argument("<message>", "The message to send")
    .action(async (chatId: string, message: string) => {
        const result = await sendTelegramMessage({
            botToken: getTelegramBotToken(),
            chatId,
            message,
        });

        // The reason fo logging in JSON is bcz agents work best with JSON
        console.log(JSON.stringify(result));
    });

await program.parseAsync(process.argv).catch((err: any) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
});

// URL to check for chatId:  https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
