import { ProfileView } from "@/components/profile/profile-view"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Mi perfil</h1>
      <ProfileView />
    </div>
  )
}
