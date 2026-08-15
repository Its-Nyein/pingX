import type { APIEmbed } from "discord-api-types/v10"

export class WebhookClient {
  constructor(private readonly url: string) {}

  async sendEmbed(_channelId: string, embed: APIEmbed): Promise<unknown> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!res.ok) {
      throw Object.assign(
        new Error(`Discord webhook returned ${res.status}`),
        { status: res.status }
      )
    }

    return res
  }

  async createDM(): Promise<{ id: string }> {
    return { id: "webhook" }
  }
}
