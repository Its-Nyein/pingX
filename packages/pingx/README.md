# pingx

Typed client for the [pingX](https://ping-x.netlify.app) event API.

```bash
npm install pingx
```

```ts
import { PingX } from "pingx"

const pingx = new PingX({ apiKey: process.env.PINGX_API_KEY! })

await pingx.send("sale", { plan: "PRO", amount: 49 })
```

## Reading events back

```ts
const { events, nextCursor } = await pingx.list({ status: "FAILED", limit: 50 })

for await (const event of pingx.paginate({ category: "sale" })) {
  console.log(event.id, event.deliveryStatus)
}
```

`paginate` follows the cursor for you, so you never handle paging by hand.

## Errors

Failures throw `PingXError` carrying the status, the server's message, and the
`eventId` when one exists — a failed delivery still stores the event, so the id
is what you use to resend it.

```ts
try {
  await pingx.send("sale", { plan: "PRO" })
} catch (error) {
  if (error instanceof PingXError && error.isRetryable) {
    // 429 or 5xx: worth trying again
  }
}
```

`isRetryable` is false for a permanent refusal, such as Discord declining to
message you — retrying that will never succeed.

## Options

| Option | Default |
| --- | --- |
| `apiKey` | required |
| `baseUrl` | `https://ping-x.netlify.app` |
| `fetch` | `globalThis.fetch` |

Pass `fetch` to supply your own implementation in tests.
