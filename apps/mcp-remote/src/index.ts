import { Hono, type Context } from "hono";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { sendTelegramMessage, telegramMessageInputSchema } from "dispatch-core";
import { createClerkClient } from "@clerk/backend";
import { generateClerkProtectedResourceMetadata } from "@clerk/mcp-tools/server";

const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkPublishableKey || !clerkSecretKey) {
  throw new Error("Missing Clerk environment variables");
}

const clerkClient = createClerkClient({
  publishableKey: clerkPublishableKey,
  secretKey: clerkSecretKey,
});

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
      inputSchema: telegramMessageInputSchema.shape,
    },
    async (input) => {
      const result = await sendTelegramMessage({
        ...input,
        botToken,
      });

      return {
        content: [
          {
            type: "text",
            text: `Sent a Telegram message ${result.messageId} to chat ${result.chatId}`,
          },
        ],
        structuredContent: result,
      };
    },
  );

  return server;
};

const app = new Hono();

app.use("*", async (c, next) => {
  console.log(c.req.method, c.req.path, c.req.header("accept"), c.req.header("content-type"));
  await next();
});

const protectedResourceMetadataUrl = (c: Context, botToken: string) => {
  return new URL(`/.well-known/oauth-protected-resource/${botToken}/mcp`, c.req.url).toString();
};

const unauthorizedResponse = (c: Context, botToken: string) => {
  c.header(
    "WWW-Authenticate",
    `Bearer realm="mcp" resource_metadata="${protectedResourceMetadataUrl(c, botToken)}"`,
  );

  return c.json({ error: "Unauthorized response" }, 401);
};

app.get("/.well-known/oauth-protected-resource/:botToken/mcp", (c: Context) => {
  const botToken = c.req.param("botToken");

  return c.json(
    generateClerkProtectedResourceMetadata({
      publishableKey: clerkPublishableKey,
      resourceUrl: new URL(`/${botToken}/mcp`, c.req.url).toString(),
    }),
  );
});

app.post("/:botToken/mcp", async (c) => {
  const botToken = c.req.param("botToken");

  if (!botToken) {
    return c.json(
      {
        error: "Missing bot token",
      },
      400,
    );
  }

  const authHeader = c.req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorizedResponse(c, botToken);
  }

  const requestState = await clerkClient
    .authenticateRequest(c.req.raw, {
      acceptsToken: "oauth_token",
    })
    .catch(() => null);

  if (!requestState?.isAuthenticated) {
    return unauthorizedResponse(c, botToken);
  }

  const server = createServer(botToken);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return transport.handleRequest(c.req.raw);
  } finally {
    await server.close();
  }
});

app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

const PORT = process.env.PORT ?? 3000;

export default {
  PORT,
  fetch: (req: Request) => {
    const url = new URL(req.url);
    url.protocol = req.headers.get("x-forwarded-proto") ?? url.protocol;
    url.host = req.headers.get("x-forwarded-host") ?? url.host;

    return app.fetch(new Request(url.toString(), req));
  },
};
