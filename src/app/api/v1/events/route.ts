import { db, events, users } from "@/db";
import { DiscordClient } from "@/lib/discord-client";
import { formatDiscordEmbed } from "@/lib/format-discord-embed";
import { deliver } from "@/lib/delivery";
import { consumeRateLimit } from "@/lib/rate-limit";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { isSearchable, likePattern } from "@/lib/search";
import { createLogger, newRequestId } from "@/lib/logger";
import {
    crossedWarnThreshold,
    getOrRollQuota,
    incrementQuota,
} from "@/lib/quota";
import { sendQuotaWarning } from "@/lib/quota-warning";
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { unknown, z } from "zod";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_DATA_FIELDS = 50;
const MAX_VALUE_LENGTH = 1024;

const REQUEST_VALIDATOR = z.object({
    category: EVENT_CATEGORY_VALIDATOR,
    data: z
        .record(
            z.string().max(64),
            z.string().max(MAX_VALUE_LENGTH).or(z.number()).or(z.boolean())
        )
        .refine((data) => Object.keys(data).length <= MAX_DATA_FIELDS, {
            message: `data may contain at most ${MAX_DATA_FIELDS} fields`,
        })
        .optional(),
    description: z.string().max(MAX_VALUE_LENGTH).optional(),
}).strict();

const LIST_VALIDATOR = z.object({
    category: EVENT_CATEGORY_VALIDATOR.optional(),
    status: z.enum(["PENDING", "DELIVERED", "FAILED"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    cursor: z.string().min(1).optional(),
    search: z.string().max(100).optional(),
});

const apiKeyFrom = (req: NextRequest) => {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
        return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }

    if (!authHeader.startsWith('Bearer ')) {
        return {
            error: NextResponse.json(
                { message: "Invalid auth header format. Expected: 'Bearer [API_KEY]'" },
                { status: 401 }
            )
        };
    }

    const apiKey = authHeader.split('Bearer ')[1];

    if (!apiKey || apiKey.trim() === '') {
        return { error: NextResponse.json({ message: "Invalid API key" }, { status: 401 }) };
    }

    return { apiKey };
};

export const GET = async (req: NextRequest) => {
    const log = createLogger("events", { requestId: newRequestId() });

    try {
        const auth = apiKeyFrom(req);
        if (auth.error) return auth.error;

        const rate = await consumeRateLimit(auth.apiKey);

        if (!rate.allowed) {
            return NextResponse.json(
                { message: `Rate limit of ${rate.limit} requests per minute exceeded` },
                { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
            );
        }

        const [user] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.apiKey, auth.apiKey))
            .limit(1);

        if (!user) {
            return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
        }

        const params = LIST_VALIDATOR.parse(
            Object.fromEntries(req.nextUrl.searchParams)
        );

        const cursor = params.cursor ? decodeCursor(params.cursor) : null;

        if (params.cursor && !cursor) {
            return NextResponse.json({ message: "Invalid cursor" }, { status: 400 });
        }

        const filters = [eq(events.userId, user.id)];

        if (params.status) filters.push(eq(events.deliveryStatus, params.status));
        if (params.category) filters.push(eq(events.name, params.category));

        if (params.search && isSearchable(params.search)) {
            filters.push(sql`${events.data}::text ILIKE ${likePattern(params.search)}`);
        }

        if (cursor) {
            filters.push(
                sql`(${events.createdAt}, ${events.id}) < (${cursor.createdAt.toISOString()}::timestamp(3), ${cursor.id})`
            );
        }

        const rows = await db
            .select({
                id: events.id,
                category: events.name,
                data: events.data,
                deliveryStatus: events.deliveryStatus,
                deliveredAt: events.deliveredAt,
                lastError: events.lastError,
                createdAt: events.createdAt,
            })
            .from(events)
            .where(and(...filters))
            .orderBy(desc(events.createdAt), desc(events.id))
            .limit(params.limit + 1);

        const hasMore = rows.length > params.limit;
        const page = hasMore ? rows.slice(0, params.limit) : rows;
        const last = page.at(-1);

        return NextResponse.json({
            events: page,
            nextCursor:
                hasMore && last
                    ? encodeCursor({ createdAt: last.createdAt, id: last.id })
                    : null,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: error.issues.map((issue) => issue.message).join("; ") },
                { status: 422 }
            );
        }

        log.error("listing events failed", { error });

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
};

export const POST = async(req: NextRequest) => {
    const log = createLogger("events", { requestId: newRequestId() });

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

        const rate = await consumeRateLimit(apiKey);

        if (!rate.allowed) {
            return NextResponse.json(
                { message: `Rate limit of ${rate.limit} requests per minute exceeded` },
                { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
            );
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

        const declaredLength = Number(req.headers.get("content-length") ?? 0);

        if (declaredLength > MAX_BODY_BYTES) {
            return NextResponse.json(
                { message: `Request body exceeds ${MAX_BODY_BYTES} bytes` },
                { status: 413 }
            );
        }

        let requestData: unknown;

        try {
            const raw = await req.text();

            if (raw.length > MAX_BODY_BYTES) {
                return NextResponse.json(
                    { message: `Request body exceeds ${MAX_BODY_BYTES} bytes` },
                    { status: 413 }
                );
            }

            requestData = JSON.parse(raw);
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

        const outcome = await deliver(discord, dmChannel.id, eventData);

        if (!outcome.delivered) {
            await db
                .update(events)
                .set({ deliveryStatus: 'FAILED', lastError: outcome.reason })
                .where(eq(events.id, event.id))

            log.error("discord delivery failed", {
                eventId: event.id,
                permanent: outcome.permanent,
                reason: outcome.reason,
            });

            return NextResponse.json({
                message: outcome.permanent
                    ? outcome.reason
                    : "Could not deliver the event to Discord. It has been stored and can be resent.",
                eventId: event.id
            }, { status: outcome.permanent ? 422 : 502 });
        }

        await db
            .update(events)
            .set({ deliveryStatus: 'DELIVERED', deliveredAt: outcome.at, lastError: null })
            .where(eq(events.id, event.id))

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
            log.error("metering failed after successful delivery", {
                eventId: event.id,
                error,
            });
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
