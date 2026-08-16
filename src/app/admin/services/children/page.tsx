import { redirect } from "next/navigation";

export default async function AdminChildServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const { categoryId = "" } = await searchParams;
  const query = categoryId
    ? `?categoryId=${encodeURIComponent(categoryId)}`
    : "";
  redirect(`/admin/service-sub-categories${query}`);
}
