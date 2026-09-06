import type { BackofficePermission } from "@/lib/shop-api";

export const backofficePermissionOptions = [
  { value: "DASHBOARD", label: "Tổng quan quản trị", description: "Xem doanh thu, thống kê và trạng thái hệ thống." },
  { value: "SERVICE_CATALOG", label: "Danh mục dịch vụ", description: "Quản lý danh mục cha, danh mục con và gói dịch vụ." },
  { value: "CURRENCY_SETTINGS", label: "Cấu hình Vàng & Ngọc", description: "Quản lý máy chủ và giá bán Vàng, Ngọc." },
  { value: "ACTIVE_ORDERS", label: "Đơn cần xử lý", description: "Xem và cập nhật các đơn đang chờ hoặc đang xử lý." },
  { value: "ORDERS", label: "Đơn dịch vụ", description: "Xem lịch sử và cập nhật trạng thái đơn dịch vụ." },
  { value: "VPS", label: "VPS Agency", description: "Quản lý gói, đơn và thông tin VPS." },
  { value: "CURRENCY_ORDERS", label: "Đơn Vàng & Ngọc", description: "Xem và xử lý đơn Vàng, Ngọc." },
  { value: "DEPOSITS", label: "Nạp tiền", description: "Xem giao dịch nạp và quản lý bảng xếp hạng." },
  { value: "BANKS", label: "Ngân hàng", description: "Quản lý tài khoản ngân hàng và cấu hình nạp tiền." },
  { value: "ACTIVITY_LOGS", label: "Nhật ký hoạt động", description: "Xem nhật ký thao tác trong hệ thống." },
  { value: "SITE_SETTINGS", label: "Giao diện shop", description: "Thay đổi logo, banner và nội dung hiển thị." },
] as const satisfies ReadonlyArray<{
  value: BackofficePermission;
  label: string;
  description: string;
}>;

export function hasBackofficePermission(
  permissions: BackofficePermission[] | undefined,
  permission: BackofficePermission,
) {
  return permissions?.includes(permission) ?? false;
}
