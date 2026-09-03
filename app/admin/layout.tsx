import { getAdminUser } from "@/lib/admin-auth";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authConfigured = isSupabaseConfigured();
  const databaseConfigured = isDatabaseConfigured();

  if (authConfigured && databaseConfigured && !(await getAdminUser())) {
    redirect("/auth/login?next=/admin/exercises");
  }

  return (
    <div className="admin-shell">
      <div className="admin-area">
        {!authConfigured || !databaseConfigured ? (
          <div className="admin-config-banner" role="status">
            <strong>Chế độ preview:</strong> hãy cấu hình Supabase để bật đăng nhập và lưu dữ liệu thật.
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
