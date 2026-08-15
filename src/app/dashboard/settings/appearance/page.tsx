import { SettingsSection } from "@/components/shell/settings-section"
import { requireUser } from "@/lib/session"
import { AppearanceForm } from "./appearance-form"

const Page = async () => {
  await requireUser()

  return (
    <SettingsSection
      title="Appearance"
      description="How pingX looks on this device."
    >
      <AppearanceForm />
    </SettingsSection>
  )
}

export default Page
