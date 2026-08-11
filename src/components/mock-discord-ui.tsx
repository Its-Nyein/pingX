import { PropsWithChildren } from "react"
import { Icons } from "./icons"
import { Cog, Gift, Headphones, HelpCircle, Inbox, Menu, Mic, Phone, Pin, PlusCircle, Search, Smile, Sticker, UserCircle, Video } from "lucide-react"
import Image from "next/image"
import { PINGX_AVATAR, avatarUrl } from "@/lib/avatar"

const MockDiscordUI = ({children} : PropsWithChildren) => {
  return (
    <div className="flex min-h-130 w-full max-w-300 overflow-hidden rounded-lg bg-discord-background text-white sm:min-h-160 lg:min-h-180 sm:rounded-xl">

        <div className="hidden md:flex w-18 bg-[#202225] py-3 flex-col items-center">
            <div className="size-12 bg-discord-brand-color rounded-2xl flex items-center justify-center mb-2 hover:rounded-xl transition-all duration-200">
                <Icons.discord className="size-3/5 text-white"/>
            </div>

            <div className="my-2 h-px w-8 rounded-full bg-white/10"/>

            {[...Array(5)].map((_, i) => (
                <div key={i} className="size-12 rounded-3xl bg-discord-background flex items-center justify-center mb-3 hover:rounded-xl transition-all duration-200 hover:bg-discord-brand-color cursor-not-allowed">
                    <span className="text-sm font-semibold text-[#b9bbbe]">
                        {String.fromCharCode(65 + i)}
                    </span>
                </div>
            ))}

            <div className="group mt-auto size-12 rounded-3xl bg-discord-background flex items-center justify-center hover:rounded-xl transition-all duration-200 hover:bg-[#3ba55c] cursor-not-allowed">
                <PlusCircle className="text-[#3ba55c] group-hover:text-white"/>
            </div>
        </div>

        <div className="hidden w-60 shrink-0 flex-col bg-[#2f3136] md:flex">
            <div className="px-4 h-16 border-b border-[#202225] flex items-center shadow-xs">
                <div className="w-full h-8 bg-[#202225] text-sm rounded flex items-center px-2 text-[#72767d] cursor-not-allowed">
                    Find or start a conversation
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-4">
                <div className="px-2 mb-4">
                    <div className="flex cursor-not-allowed items-center rounded px-2 py-1.5 text-sm text-discord-text hover:bg-[#393c43]">
                        <UserCircle className="mr-3 size-5 text-[#b9bbbe]"/>
                        <span className="text-sm font-medium">Friends</span>
                    </div>
                    <div className="flex cursor-not-allowed items-center rounded px-2 py-1.5 text-sm text-discord-text hover:bg-[#393c43]">
                        <Inbox className="mr-3 size-5 text-[#b9bbbe]"/>
                        <span className="text-sm font-medium">Nitro</span>
                    </div>
                </div>

                <div className="px-2 mb-4">
                    <h3 className="text-xs font-semibold text-[#8e9297] px-2 mb-2 uppercase">
                        Direct Messages
                    </h3>
                    <div className="flex items-center px-2 py-1.5 rounded-md bg-[#393c43] text-white cursor-pointer">
                        <Image
                          src={PINGX_AVATAR}
                          width={32}
                          height={32}
                          alt="pingX avatar"
                          className="object-cover rounded-full mr-3"
                        />
                        <span className="font-medium">Ping_X</span>
                    </div>

                    <div className="my-1 space-y-px">
                        {[...Array(4)].map((_, i) => (
                            <div
                            key={i}
                            className="flex cursor-not-allowed items-center rounded px-2 py-1.5 text-[#72767d]"
                            >
                            <Image
                              src={avatarUrl(`pingx-user-${i + 1}`)}
                              alt=""
                              width={32}
                              height={32}
                              className="mr-3 size-8 rounded-full bg-white/5 object-cover"
                            />
                            <span className="font-medium">User {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-2 bg-[#292b2f] flex items-center">
                <Image
                  src={PINGX_AVATAR}
                  width={32}
                  height={32}
                  alt=""
                  className="mr-2 size-8 rounded-full object-cover"
                />
                <div className="flex-1">
                    <p className="text-sm font-medium text-white">ping_X</p>
                    <p className="text-xs text-[#b9bbbe] flex items-center">@ping_x</p>
                </div>

                <div className="flex items-center space-x-2">
                    <Mic className="size-5 text-[#b9bbbe] hover:text-white cursor-pointer"/>
                    <Headphones className="size-5 text-[#b9bbbe] hover:text-white cursor-pointer"/>
                    <Cog className="size-5 text-[#b9bbbe] hover:text-white cursor-pointer"/>
                </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col">

            <div className="h-16 bg-[#36393f] flex items-center px-4 shadow-xs border-b border-[#202225]">
                <div className="md:hidden mr-4">
                    <Menu className="size-6 text-[#b9bbbe] hover:text-white cursor-pointer"/>
                </div>

                <div className="flex items-center">
                    <div className="relative">
                        <Image
                          src={PINGX_AVATAR}
                          alt="pingX avatar"
                          width={40}
                          height={40}
                          className="object-cover rounded-full mr-3"
                        />
                        <div className="absolute bottom-0 right-3 size-3 bg-green-500 rounded-full border-2 border-[#36393f]" />
                    </div>
                    <p className="font-semibold text-white">ping_X</p>
                </div>

                <div className="ml-auto flex items-center space-x-2 lg:space-x-4 text-[#b9bbbe]">
                    <Phone className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                    <Video className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                    <Pin className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                    <UserCircle className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                    <Search className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                    <Inbox className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                    <HelpCircle className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto bg-discord-background">
                <div className="px-4 pb-2 pt-6">
                    <Image
                      src={PINGX_AVATAR}
                      alt=""
                      width={64}
                      height={64}
                      className="mb-3 size-16 rounded-full object-cover"
                    />
                    <h2 className="text-2xl font-bold text-white">ping_X</h2>
                    <p className="mt-1 text-sm text-[#b9bbbe]">
                        This is the beginning of your direct message history with{" "}
                        <span className="font-medium text-white">@ping_X</span>.
                    </p>
                </div>

                <div className="flex items-center gap-3 px-4 py-3">
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="text-[11px] font-semibold text-[#b9bbbe]">
                        Today
                    </span>
                    <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="flex flex-1 flex-col-reverse p-2">
                    {children}
                </div>

                <div className="flex items-center gap-2 px-4 pb-2 text-xs text-discord-timestamp">
                    <span className="flex gap-0.5">
                        <span className="size-1 animate-bounce rounded-full bg-[#b9bbbe] [animation-delay:-0.3s]" />
                        <span className="size-1 animate-bounce rounded-full bg-[#b9bbbe] [animation-delay:-0.15s]" />
                        <span className="size-1 animate-bounce rounded-full bg-[#b9bbbe]" />
                    </span>
                    <span>
                        <span className="font-medium text-[#b9bbbe]">ping_X</span> is
                        watching your events
                    </span>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center bg-[#40444b] rounded-lg p-1">
                    <PlusCircle className="mx-3 text-[#b9bbbe] hover:text-white cursor-not-allowed"/>
                    <input
                       type="text"
                       placeholder="Message @ping_X"
                       readOnly
                       className="flex-1 bg-transparent py-2 px-1 text-white placeholder-discord-timestamp focus:outline-hidden cursor-not-allowed"
                    />
                    <div className="flex items-center space-x-3 text-[#b9bbbe]">
                        <Gift className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                        <Sticker className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                        <Smile className="size-5 hover:text-white cursor-not-allowed hidden sm:block"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default MockDiscordUI
