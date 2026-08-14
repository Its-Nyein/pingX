export type DeliveryStatus = "PENDING" | "DELIVERED" | "FAILED"

export interface PingXEvent {
  id: string
  category: string
  data: Record<string, string | number | boolean>
  deliveryStatus: DeliveryStatus
  deliveredAt: string | null
  lastError: string | null
  createdAt: string
}

export interface SendResult {
  message: string
  eventId?: string
}

export interface ListOptions {
  category?: string
  status?: DeliveryStatus
  search?: string
  limit?: number
  cursor?: string
}

export interface ListResult {
  events: PingXEvent[]
  nextCursor: string | null
}

export class PingXError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly eventId?: string
  ) {
    super(message)
    this.name = "PingXError"
  }

  get isRetryable(): boolean {
    return this.status === 429 || this.status >= 500
  }
}

export interface PingXOptions {
  apiKey: string
  baseUrl?: string
  fetch?: typeof globalThis.fetch
}

const DEFAULT_BASE_URL = "https://ping-x.netlify.app"

export class PingX {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetchImpl: typeof globalThis.fetch

  constructor({ apiKey, baseUrl, fetch: fetchImpl }: PingXOptions) {
    if (!apiKey) throw new Error("pingX: apiKey is required")

    this.apiKey = apiKey
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "")
    this.fetchImpl = fetchImpl ?? globalThis.fetch
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    })

    const body = (await res.json().catch(() => null)) as
      | (Record<string, unknown> & { message?: string; eventId?: string })
      | null

    if (!res.ok) {
      throw new PingXError(
        body?.message ?? res.statusText,
        res.status,
        body?.eventId
      )
    }

    return body as T
  }

  send(
    category: string,
    data?: Record<string, string | number | boolean>,
    description?: string
  ): Promise<SendResult> {
    return this.request<SendResult>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify({ category, data, description }),
    })
  }

  list(options: ListOptions = {}): Promise<ListResult> {
    const query = new URLSearchParams()

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) query.set(key, String(value))
    }

    const suffix = query.toString() ? `?${query}` : ""

    return this.request<ListResult>(`/api/v1/events${suffix}`)
  }

  async *paginate(options: Omit<ListOptions, "cursor"> = {}) {
    let cursor: string | null = null

    do {
      const page: ListResult = await this.list(
        cursor ? { ...options, cursor } : options
      )

      for (const event of page.events) yield event

      cursor = page.nextCursor
    } while (cursor)
  }
}
