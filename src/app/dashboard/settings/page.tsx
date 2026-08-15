import { SettingsSection } from "@/components/shell/settings-section"
import { requireUser } from "@/lib/session"
import { ProfileForm } from "./profile-form"

const Page = async () => {
  const user = await requireUser()

  return (
    <SettingsSection
      title="Profile"
      description="How you appear inside pingX."
    >
      <ProfileForm name={user.name ?? ""} email={user.email} />
    </SettingsSection>
  )
}

export default Page
