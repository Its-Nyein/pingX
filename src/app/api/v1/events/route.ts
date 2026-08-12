import { db, events, users } from "@/db";
import { DiscordClient } from "@/lib/discord-client";
import { formatDiscordEmbed } from "@/lib/format-discord-embed";
import {
    crossedWarnThreshold,
    getOrRollQuota,
    incrementQuota,
} from "@/lib/quota";
import { sendQuotaWarning } from "@/lib/quota-warning";
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { unknown, z } from "zod";

const REQUEST_VALIDATOR = z.object({
    category: EVENT_CATEGORY_VALIDATOR,
    data: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
    description: z.string().optional(),
}).strict();

export const POST = async(req: NextRequest) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if(!authHeader) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if(!authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: "Invalid auth header format. Expected: 'Bearer [API_KEY]'" }, { status: 401 });
        }

        const apiKey = authHeader.split('Bearer ')[1];
        if(!apiKey || apiKey.trim() === '') {
            return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.apiKey, apiKey),
            with: {
                eventCategories: true
            }
        })

        if(!user) {
            return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
        }

        if(!user.discordId) {
            return NextResponse.json({ message: "Please enter your discord ID in your account settings" }, { status: 403 });
        }

        const quota = await getOrRollQuota(user.id, user.plan);

        if (quota.used >= quota.limit) {
            return NextResponse.json(
                {
                    error: "Monthly quota reached. Please upgrade your plan for more events",
                    limit: quota.limit,
                    used: quota.used,
                    resetsAt: quota.resetsAt.toISOString(),
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(
                            Math.max(1, Math.ceil((quota.resetsAt.getTime() - Date.now()) / 1000))
                        ),
                    },
                }
            );
        }

        const discord = new DiscordClient(process.env.DISCORD_BOT_TOKEN);
        const dmChannel = await discord.createDM(user.discordId);

        let requestData = unknown;

        try {
            requestData = await req.json();
        } catch (error) {
            return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
        }

        const validationResult = REQUEST_VALIDATOR.parse(requestData);
        const category = user.eventCategories.find((c) => c.name === validationResult.category);

        if(!category) {
            return NextResponse.json({ message: `You dont have a category named "${validationResult.category}"` }, { status: 404 });
        }

        const eventData = formatDiscordEmbed({
            categoryName: category.name,
            description: validationResult.description,
            data: validationResult.data,
        })

        const [event] = await db
            .insert(events)
            .values({
                name: category.name,
                userId: user.id,
                data: validationResult.data || {},
                eventCategoryId: category.id
            })
            .returning()

        try {
            await discord.sendEmbed(dmChannel.id, eventData);

            await db
                .update(events)
                .set({ deliveryStatus: 'DELIVERED' })
                .where(eq(events.id, event.id))
        } catch (error) {
            await db
                .update(events)
                .set({ deliveryStatus: 'FAILED' })
                .where(eq(events.id, event.id))

            console.error("[events] discord delivery failed", error);
            return NextResponse.json({
                message: "Error processing the event. Please try again later",
                eventId: event.id
            }, { status: 500 });
        }

        try {
            const { used, warned80 } = await incrementQuota(user.id);

            if (crossedWarnThreshold(used, quota.limit, warned80)) {
                await sendQuotaWarning({
                    discord,
                    channelId: dmChannel.id,
                    userId: user.id,
                    used,
                    limit: quota.limit,
                });
            }
        } catch (error) {
            console.error("[events] metering failed after successful delivery", error);
        }

        return NextResponse.json({ message: "Event processed successfully", eventId: event.id });
    } catch (error) {
        console.error(error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.message }, { status: 422 })
            }

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
