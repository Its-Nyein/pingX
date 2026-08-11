import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import Image from "next/image"
import { PINGX_AVATAR } from "@/lib/avatar"

interface DiscordMessageProps {
    avatarSrc: string
    avatarAlt: string
    username: string
    timestamp: string
    badgeText?: string
    badgeColor?: string
    title: string
    content: {
        [key: string]: string
    }
}

type BadgeColor = "#43b581" | "#faa61a" | (string & {})

const getBadgeStyles = (color: BadgeColor) => {
    switch(color) {
        case "#43b581":
            return "bg-[#43b581]/10 text-[#43b581] ring-[#43b581]/20"
        case "#faa61a":
            return "bg-[#faa61a]/10 text-[#faa61a] ring-[#faa61a]/20"
        default:
            return "bg-[#5865f2]/10 text-[#8891f2] ring-[#5865f2]/20"
    }
}

const formatKey = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())

const DiscordMessage = ({
    avatarSrc, avatarAlt, username, timestamp, badgeText, badgeColor = "#43b581", title, content
}: DiscordMessageProps) => {
  return (
    <div className="group flex w-full items-start gap-3 rounded px-2 py-1 transition-colors hover:bg-white/2">
        <Image
          src={avatarSrc}
          alt={avatarAlt}
          width={40}
          height={40}
          className="mt-0.5 size-10 shrink-0 rounded-full object-cover"
        />

        <div className="w-full min-w-0 max-w-xl">
            <div className="flex flex-wrap items-center gap-x-1.5">
                <span className="font-medium text-white">{username}</span>

                <span className="inline-flex items-center gap-0.5 rounded bg-discord-brand-color px-1 py-px text-[10px] font-semibold uppercase leading-4 text-white">
                    <Check className="size-2.5 shrink-0" strokeWidth={4} />
                    App
                </span>

                <span className="text-xs font-medium text-discord-timestamp">
                    {timestamp}
                </span>
            </div>

            <div className="mt-1.5 mb-4 overflow-hidden rounded bg-[#2f3136]">
                <div className="p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{title}</p>

                        {badgeText ? (
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                getBadgeStyles(badgeColor)
                            )}
                            >
                                {badgeText}
                            </span>
                        ): null}
                    </div>

                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                        {Object.entries(content).map(([key, value]) => (
                            <div key={key} className="min-w-0">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#b9bbbe]">
                                    {formatKey(key)}
                                </dt>
                                <dd className="truncate text-sm text-discord-text">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-2">
                        <Image
                          src={PINGX_AVATAR}
                          alt=""
                          width={16}
                          height={16}
                          className="size-4 rounded-full object-cover"
                        />
                        <span className="text-[11px] text-discord-timestamp">
                            pingX &bull; {timestamp}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default DiscordMessage
