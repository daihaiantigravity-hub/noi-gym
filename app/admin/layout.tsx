import { getAdminUser } from "@/lib/admin-auth";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { redirect } from "next/navigation";
import { getAppLanguage } from "@/lib/i18n/server";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authConfigured = isSupabaseConfigured();
  const databaseConfigured = isDatabaseConfigured();
  const text = getWorkspaceMessages(await getAppLanguage());

  if (authConfigured && databaseConfigured && !(await getAdminUser())) {
    redirect("/auth/login?next=/admin/exercises");
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-area">
        {!authConfigured || !databaseConfigured ? (
          <div className="admin-config-banner" role="status">
            {text.previewMode}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
