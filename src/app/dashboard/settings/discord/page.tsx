import { SettingsSection } from "@/components/shell/settings-section"
import { requireUser } from "@/lib/session"
import { DiscordForm } from "./discord-form"

const Page = async () => {
  const user = await requireUser()

  return (
    <SettingsSection
      title="Discord"
      description="Where pingX delivers your events, unless a category has its own channel."
    >
      <DiscordForm discordId={user.discordId ?? ""} />
    </SettingsSection>
  )
}

export default Page
