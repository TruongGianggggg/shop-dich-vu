import { AdminServicesManager } from "@/app/components/admin/admin-services-manager";
import { RoleGate } from "@/app/components/role-gate";
import "../services/services-upload.css";

export default async function AdminServiceSubCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId = "" } = await searchParams;

  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <AdminServicesManager
        initialCategoryId={categoryId}
        view="children"
      />
    </RoleGate>
  );
}
