<!-- SYNTHETIC FIXTURE: written for docs-gate testing only. Not real product documentation. -->

# Tutorial: Send your first message with the Widget SDK

This tutorial is for developers who have never used the Widget SDK before. By the end, you'll have
a running script that sends one message and prints the server's response.

## Prerequisites

- Node.js 18 or later installed
- A Widget account and an API key (see [Create an API key](#) if you don't have one)

## What you'll have when you're done

A single script, `send.mjs`, that sends a message to the Widget API and prints the response to
your terminal.

## Step 1: Install the SDK

```bash
npm install @widget/sdk
```

## Step 2: Create the script

Create a file named `send.mjs` with the following content:

```js
import { WidgetClient } from "@widget/sdk";

const client = new WidgetClient({ apiKey: process.env.WIDGET_API_KEY });

const response = await client.messages.send({
  to: "test-channel",
  text: "Hello from the tutorial!",
});

console.log(response.id);
```

## Step 3: Set your API key and run the script

```bash
export WIDGET_API_KEY="your-api-key-here"
node send.mjs
```

You should see a message ID printed to your terminal, such as `msg_01AbCdEf`.

## Next steps

- See the [Widget API reference](#) for the full set of message fields.
- See [Handling errors](#) for what to do when a send fails.
