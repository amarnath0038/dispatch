import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { sendTelegramMessage, telegramMessageInputSchema } from "dispatch-core";

const server = new McpServer({
  name: "dispatch-local",
  version: "0.0.0",
});

const getTelegramBotToken = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("Telegram bot token not found. Configure it in your MCP client");
  }

  return token;
};

server.registerTool(
  "telegram",
  {
    title: "telegram",
    description: "Send a telegram message",
    inputSchema: telegramMessageInputSchema.shape,
  },
  async (input) => {
    const result = await sendTelegramMessage({
      ...input,
      botToken: getTelegramBotToken(),
    });

    return {
      content: [
        {
          type: "text",
          text: `Send a Telegram message ${result.messageId} to chat ${result.chatId}`,
        },
      ],
      structuredContent: result,
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
