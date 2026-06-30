---
name: dispatch
description: Send Telegram messages from an agent through the Dispatch MCP `telegram` tool, with the Dispatch CLI (`@amarnath00/dispatch`) as a fallback. Use when a user asks to send a Telegram message, mentions Dispatch, wants to interact with the Dispatch toolset, asks to verify Dispatch manually, or needs to choose between the Dispatch MCP and CLI workflows.
---

# Dispatch

Dispatch sends Telegram messages. It exposes the same operation in two ways, both backed by `@amarnath00/dispatch-core`:

- **MCP tool** (`dispatch` server → `telegram` tool) — preferred for agents.
- **CLI** (`@amarnath00/dispatch`, binary `dispatch`) — fallback when MCP is unavailable or for manual verification.

Both take a `chatId` and a `message`, call the Telegram Bot API, and return:

```json
{
  "ok": true,
  "chatId": "...",
  "messageId": 42
}
```

## Choosing MCP vs CLI

Prefer the **MCP tool** whenever the Dispatch MCP server is connected. The bot token is supplied by the MCP server environment, so the caller only provides the message inputs.

Use the **CLI** when:

- The Dispatch MCP server is not connected in the current session.
- Verifying behavior manually from a terminal or script.
- Using a locally configured Telegram bot token instead of the MCP environment.

## MCP workflow (preferred)

Call the `telegram` tool on the Dispatch MCP server with:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `chatId` | string | Yes | Telegram chat ID (non-empty) |
| `message` | string | Yes | Message text (non-empty) |

The Telegram bot token is provided by the MCP server environment (`TELEGRAM_BOT_TOKEN`) and **must not** be included in the tool input.

On success, the tool returns:

```json
{
  "ok": true,
  "chatId": "...",
  "messageId": 42
}
```

## CLI workflow (fallback)

Configure the CLI once by storing your Telegram bot token locally:

```bash
dispatch init --telegram-bot-token <botToken>
```

The configuration is stored at:

```
~/.config/dispatch/config.json
```

with file permissions `0600`.

Send a message:

```bash
dispatch telegram <chatId> <message>
```

or without installing globally:

```bash
bunx @amarnath00/dispatch telegram <chatId> <message>
```

(An `npx` equivalent may also be used.)

On success, the CLI prints JSON similar to:

```json
{
  "ok": true,
  "chatId": "...",
  "messageId": 42
}
```

If no bot token has been configured, the CLI exits with:

```
Telegram bot token is required. Run `dispatch init`.
```

## Verifying manually

To verify Dispatch works end-to-end, send a test message to a known Telegram chat ID:

```bash
dispatch telegram <yourChatId> "Dispatch test message"
```

A successful invocation returns JSON containing:

- `ok: true`
- the destination `chatId`
- a numeric `messageId`

If the request fails, Dispatch surfaces the Telegram Bot API error (for example, an invalid bot token or an unknown chat ID).