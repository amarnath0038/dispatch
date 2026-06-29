import { Hono } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { sendTelegramMessage, telegramMessageInputSchema } from "dispatch-core";


const createServer = (botToken: string) => {
    const server = new McpServer({
        name: "dispatch-remote",
        version: "0.0.0",
    });

    server.registerTool(
        "telegram",
        {
            title: "telegram",
            description: "Send a telegram message",
            inputSchema: telegramMessageInputSchema.shape
        },
        async (input) => {
            const result = await sendTelegramMessage({
                ...input,
                botToken
            });

            return {
                content: [
                    {
                        type: "text",
                        text: `Sent a Telegram message ${result.messageId} to chat ${result.chatId}`
                    }
                ],
                structuredContent: result
            }
        }
    );

    return server;
}


const app = new Hono();


app.use("*", async (c, next) => {
    console.log(
        c.req.method,
        c.req.path,
        c.req.header("accept"),
        c.req.header("content-type")
    );
    await next();
});


app.post("/:botToken/mcp", async (c) => {
    const botToken = c.req.param("botToken");
    console.log(botToken)
    if (!botToken) {
        return c.json({
            error: "Missing bot token"
        }, 400);
    }

    const server = createServer(botToken);

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });

    await server.connect(transport);

    try {
        return transport.handleRequest(c.req.raw);
    } finally {
        await server.close();
    }

    return c.json({ ok: true });
})


app.notFound((c) => {
    return c.json({ error: "Not Found" }, 404);
})

const PORT = process.env.PORT ?? 3000;

export default {
    PORT,
    fetch: app.fetch
}