import { FREE_QUOTA, PRO_QUOTA } from "@/config";
import { db } from "@/db";
import { DiscordClient } from "@/lib/discord-client";
import { EVENT_CATEGORY_VALIDATOR } from "@/lib/validators/validator";
import { NextRequest, NextResponse } from "next/server";
import { unknown, z } from "zod";

const REQUEST_VALIDATOR = z.object({
    category: EVENT_CATEGORY_VALIDATOR,
    data: z.record(z.string().or(z.number()).or(z.boolean())).optional(),
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

        const user = await db.user.findUnique({
            where: {
                apiKey,
            },
            include: {
                eventCategories: true
            }
        })

        if(!user) {
            return NextResponse.json({ message: "Invalid API key" }, { status: 401 });
        }

        if(!user.discordId) {
            return NextResponse.json({ message: "Please enter your discord ID in your account settings" }, { status: 403 });
        }

        // Actual Logic
        const currentData = new Date();
        const currentMonth = currentData.getMonth() + 1;
        const currentYear = currentData.getFullYear();

        const quota = await db.quota.findUnique({
            where: {
                userId: user.id,
                month: currentMonth,
                year: currentYear
            }
        })

        const quotaLimit = user.plan === 'FREE' ? FREE_QUOTA.maxEventsPerMonth : PRO_QUOTA.maxEventsPerMonth;

        // can throw 429 when quota is reached or need payment for plan upgrade
        if(quota && quota.count >= quotaLimit) {
            return NextResponse.json({ message: "Monthly quota reached. Please upgrade your plan for more events" }, { status: 429 });
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

        // use fields instead of data
        // The fields structure is only required by Discord when formatting messages.
        const eventData = {
            title: `${category.name.charAt(0).toUpperCase() + category.name.slice(1)}`,
            description: validationResult.description || `A new ${category.name} event has occurred`,
            timestamp: new Date().toISOString(),
            fields: Object.entries(validationResult.data || {}).map(
                ([key, value]) => {
                    return {
                        name: key,
                        value: String(value),
                        inline: false
                    }
                }
            )
        }

        const event = await db.event.create({
            data: {
                name: category.name,
                formattedMessage: `${eventData.title}\n\n${eventData.description}`,
                userId: user.id,
                data: validationResult.data || {},
                eventCategoryId: category.id
            }
        })

        try {
            await discord.sendEmbed(dmChannel.id, eventData);

            await db.event.update({
                where: {id: event.id},
                data: { deliveryStatus: 'DELIVERED'}
            })

            await db.quota.upsert({
                where: {userId: user.id, month: currentMonth, year: currentYear},
                update: {count: {increment: 1}},
                create: {
                    userId: user.id,
                    month: currentMonth,
                    year: currentYear,
                    count: 1
                }
            })
        } catch (error) {
            await db.event.update({
                where: {id: event.id},
                data: { deliveryStatus: 'FAILED'}
            })

            console.log(error);
            return NextResponse.json({
                message: "Error processing the event. Please try again later",
                eventId: event.id
            }, { status: 500 });
        }

        return NextResponse.json({ message: "Event processed successfully", eventId: event.id });
    } catch (error) {
        console.error(error);

        //422 (Unprocessable Entity) status code means the server understands the content type of the request       entity 
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.message }, { status: 422 })
            }

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }    
}