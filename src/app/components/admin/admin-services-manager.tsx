"use client";

import {
  ImageUp,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";
import { formatIntegerInput, normalizeIntegerInput } from "@/lib/integer-input";
import {
  AuthResponse,
  formatVnd,
  getApiErrorMessage,
  PageResponse,
  ServiceCategory,
  ServiceCategoryPayload,
  ServicePackage,
  ServicePackagePayload,
  ServiceSubCategory,
  ServiceSubCategoryPayload,
} from "@/lib/shop-api";

type ModalMode = "category" | "subCategory" | "package" | "";

type CategoryForm = {
  name: string;
  description: string;
  displayOrder: string;
  active: boolean;
};

type SubCategoryForm = {
  parentId: string;
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  the9pServiceCode: string;
  displayOrder: string;
  serviceCount: string;
  active: boolean;
};

type PackageForm = {
  subCategoryId: string;
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  the9pAmount: string;
  displayOrder: string;
  active: boolean;
};

type The9pTestResult = {
  checkedAt: string;
  data: unknown;
  durationMs: number;
  ok: boolean;
  productCount: number | null;
  status: number;
};

type The9pSyncResult = {
  productCount: number;
  parentCategoriesCreated: number;
  subCategoriesCreated: number;
  subCategoriesUpdated: number;
  packagesCreated: number;
  packagesUpdated: number;
  packagesDisabled: number;
  skippedProducts: number;
};

const emptyCategoryForm: CategoryForm = {
  name: "",
  description: "",
  displayOrder: "0",
  active: true,
};

const emptySubCategoryForm: SubCategoryForm = {
  parentId: "",
  name: "",
  description: "",
  imageUrl: "",
  type: "GAME_SERVICE",
  the9pServiceCode: "",
  displayOrder: "0",
  serviceCount: "0",
  active: true,
};

const emptyPackageForm: PackageForm = {
  subCategoryId: "",
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  the9pAmount: "",
  displayOrder: "0",
  active: true,
};

const serviceTypes = [
  "GAME_SERVICE",
  "TOPUP_CAROT",
  "TOPUP_LIEN_QUAN_QUAN_HUY",
  "TOPUP_FREE_FIRE_DIAMOND",
  "TOPUP_THE9P",
];

export function AdminServicesManager() {
  const session = useAuthSession();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>("");
  const [editingId, setEditingId] = useState("");
  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(emptyCategoryForm);
  const [subCategoryForm, setSubCategoryForm] =
    useState<SubCategoryForm>(emptySubCategoryForm);
  const [packageForm, setPackageForm] = useState<PackageForm>(emptyPackageForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isTestingThe9p, setIsTestingThe9p] = useState(false);
  const [isSyncingThe9p, setIsSyncingThe9p] = useState(false);
  const [the9pTestResult, setThe9pTestResult] =
    useState<The9pTestResult | null>(null);
  const [updatingId, setUpdatingId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const canLoad = session?.role === "ADMIN";
  const subCategories = useMemo(
    () =>
      categories
        .flatMap((category) =>
          category.children.map((child) => ({
            ...child,
            categoryName: category.name,
          })),
        )
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [categories],
  );
  const selectedSubCategory =
    subCategories.find((item) => item.id === selectedSubCategoryId) ?? null;

  useEffect(() => {
    if (!canLoad || !session) {
      return;
    }

    const activeSession = session;
    let ignore = false;

    async function loadCategories() {
      setIsLoadingCategories(true);
      setError("");

      try {
        const response = await fetch("/api/admin/service-categories", {
          headers: authHeaders(activeSession),
        });
        const data = (await readResponseJson(response)) as
          | ServiceCategory[]
          | PageResponse<ServiceCategory>
          | unknown;

        if (!response.ok) {
          throw new Error(
            getAdminServiceErrorMessage(
              response,
              data,
              "Khong tai duoc danh muc dich vu.",
            ),
          );
        }

        if (ignore) {
          return;
        }

        const nextCategories = normalizeList<ServiceCategory>(data)
          .map((category) => ({
            ...category,
            children: [...(category.children ?? [])].sort(
              (a, b) => a.displayOrder - b.displayOrder,
            ),
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);

        setCategories(nextCategories);
        setSelectedSubCategoryId((current) => {
          if (
            current &&
            nextCategories.some((category) =>
              category.children.some((child) => child.id === current),
            )
          ) {
            return current;
          }

          return nextCategories[0]?.children[0]?.id ?? "";
        });
      } catch (exception) {
        if (!ignore) {
          setCategories([]);
          setSelectedSubCategoryId("");
          setError(
            exception instanceof Error
              ? exception.message
              : "Khong tai duoc danh muc dich vu.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      ignore = true;
    };
  }, [canLoad, refreshKey, session]);

  useEffect(() => {
    if (!canLoad || !session || !selectedSubCategoryId) {
      return;
    }

    const activeSession = session;
    let ignore = false;

    async function loadPackages() {
      setIsLoadingPackages(true);
      setError("");

      try {
        const data = await fetchPackageList(activeSession, selectedSubCategoryId);

        if (!ignore) {
          setPackages(
            normalizeList<ServicePackage>(data).sort(
              (a, b) => a.displayOrder - b.displayOrder,
            ),
          );
        }
      } catch (exception) {
        if (!ignore) {
          setPackages([]);
          setError(
            exception instanceof Error
              ? exception.message
              : "Khong tai duoc goi dich vu.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingPackages(false);
        }
      }
    }

    loadPackages();

    return () => {
      ignore = true;
    };
  }, [canLoad, selectedSubCategoryId, session]);

  function refreshAll() {
    setMessage("");
    setRefreshKey((current) => current + 1);
  }

  async function testThe9pConnection() {
    if (!session) {
      return;
    }

    const startedAt = performance.now();
    setIsTestingThe9p(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/the9p/recharge-products", {
        headers: authHeaders(session),
      });
      const data = await readResponseJson(response);
      const result: The9pTestResult = {
        checkedAt: new Date().toISOString(),
        data,
        durationMs: Math.round(performance.now() - startedAt),
        ok: response.ok,
        productCount: Array.isArray(data) ? data.length : null,
        status: response.status,
      };

      setThe9pTestResult(result);

      if (!response.ok) {
        setError(
          getAdminServiceErrorMessage(
            response,
            data,
            "The9P không trả về kết quả hợp lệ.",
          ),
        );
        return;
      }

      setMessage(
        `Kết nối The9P thành công, nhận được ${result.productCount ?? 0} sản phẩm.`,
      );
    } catch (exception) {
      const data = {
        message:
          exception instanceof Error
            ? exception.message
            : "Không gọi được API kiểm tra The9P.",
      };
      setThe9pTestResult({
        checkedAt: new Date().toISOString(),
        data,
        durationMs: Math.round(performance.now() - startedAt),
        ok: false,
        productCount: null,
        status: 0,
      });
      setError(data.message);
    } finally {
      setIsTestingThe9p(false);
    }
  }

  async function syncThe9pPackages() {
    if (!session) {
      return;
    }

    setIsSyncingThe9p(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/the9p/sync-packages", {
        method: "POST",
        headers: authHeaders(session),
      });
      const data = await readResponseJson(response);

      if (!response.ok) {
        setError(
          getAdminServiceErrorMessage(
            response,
            data,
            "Không đồng bộ được sản phẩm từ The9P.",
          ),
        );
        return;
      }

      const result = data as The9pSyncResult;
      setMessage(
        `Đã lấy ${result.productCount} sản phẩm từ The9P: tạo ${result.subCategoriesCreated} danh mục, tạo ${result.packagesCreated} gói, cập nhật ${result.packagesUpdated} gói${result.packagesDisabled ? `, ngừng bán ${result.packagesDisabled} gói` : ""}.`,
      );
      setRefreshKey((current) => current + 1);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Không gọi được API đồng bộ The9P.",
      );
    } finally {
      setIsSyncingThe9p(false);
    }
  }

  function openCreateCategory() {
    setEditingId("");
    setCategoryForm(emptyCategoryForm);
    openModal("category");
  }

  function openEditCategory(category: ServiceCategory) {
    setEditingId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
      displayOrder: String(category.displayOrder),
      active: category.active,
    });
    openModal("category");
  }

  function openCreateSubCategory(parentId = categories[0]?.id ?? "") {
    setEditingId("");
    setSubCategoryForm({
      ...emptySubCategoryForm,
      parentId,
    });
    openModal("subCategory");
  }

  function openEditSubCategory(subCategory: ServiceSubCategory) {
    setEditingId(subCategory.id);
    setSubCategoryForm({
      parentId: subCategory.parentId,
      name: subCategory.name,
      description: subCategory.description ?? "",
      imageUrl: subCategory.imageUrl ?? "",
      type: subCategory.type,
      the9pServiceCode: subCategory.the9pServiceCode ?? "",
      displayOrder: String(subCategory.displayOrder),
      serviceCount: String(subCategory.serviceCount),
      active: subCategory.active,
    });
    openModal("subCategory");
  }

  function openCreatePackage(subCategoryId = selectedSubCategoryId) {
    setEditingId("");
    setPackageForm({
      ...emptyPackageForm,
      subCategoryId,
    });
    openModal("package");
  }

  function openEditPackage(item: ServicePackage) {
    setEditingId(item.id);
    setPackageForm({
      subCategoryId: item.subCategoryId,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      originalPrice: item.originalPrice === null ? "" : String(item.originalPrice),
      the9pAmount: item.the9pAmount === null ? "" : String(item.the9pAmount),
      displayOrder: String(item.displayOrder),
      active: item.active,
    });
    openModal("package");
  }

  function openModal(mode: ModalMode) {
    setModalMode(mode);
    setMessage("");
    setError("");
  }

  function closeModal() {
    setModalMode("");
    setEditingId("");
    setCategoryForm(emptyCategoryForm);
    setSubCategoryForm(emptySubCategoryForm);
    setPackageForm(emptyPackageForm);
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const payload: ServiceCategoryPayload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
      displayOrder: numberFromInput(categoryForm.displayOrder),
      active: categoryForm.active,
    };

    await saveEntity({
      path: editingId
        ? `/api/admin/service-categories/${editingId}`
        : "/api/admin/service-categories",
      method: editingId ? "PUT" : "POST",
      payload,
      successMessage: editingId ? "Da cap nhat danh muc." : "Da tao danh muc.",
      session,
    });
  }

  async function submitSubCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const payload: ServiceSubCategoryPayload = {
      parentId: subCategoryForm.parentId,
      name: subCategoryForm.name.trim(),
      description: subCategoryForm.description.trim(),
      imageUrl: textOrNull(subCategoryForm.imageUrl),
      type: subCategoryForm.type,
      the9pServiceCode: textOrNull(subCategoryForm.the9pServiceCode),
      displayOrder: numberFromInput(subCategoryForm.displayOrder),
      serviceCount: numberFromInput(subCategoryForm.serviceCount),
      active: subCategoryForm.active,
    };

    await saveEntity({
      path: editingId
        ? `/api/admin/service-sub-categories/${editingId}`
        : "/api/admin/service-sub-categories",
      method: editingId ? "PUT" : "POST",
      payload,
      successMessage: editingId ? "Da cap nhat dich vu." : "Da tao dich vu.",
      session,
    });
  }

  async function uploadServiceImage(file: File) {
    if (!session) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5 MB.");
      return;
    }

    setIsUploadingImage(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/service-images", {
        method: "POST",
        headers: authHeaders(session),
        body,
      });
      const data = (await readResponseJson(response)) as unknown;

      if (!response.ok) {
        throw new Error(
          getAdminServiceErrorMessage(response, data, "Không tải được ảnh lên."),
        );
      }

      const imageUrl =
        data && typeof data === "object" && "imageUrl" in data
          ? (data as { imageUrl?: unknown }).imageUrl
          : null;
      if (typeof imageUrl !== "string" || !imageUrl) {
        throw new Error("Backend không trả về đường dẫn ảnh hợp lệ.");
      }

      setSubCategoryForm((current) => ({ ...current, imageUrl }));
      setMessage("Đã tải ảnh lên. Hãy bấm Lưu để gắn ảnh vào dịch vụ.");
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Không tải được ảnh lên.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function submitPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    const payload: ServicePackagePayload = {
      subCategoryId: packageForm.subCategoryId,
      name: packageForm.name.trim(),
      description: packageForm.description.trim(),
      price: numberFromInput(packageForm.price),
      originalPrice: nullableNumberFromInput(packageForm.originalPrice),
      the9pAmount: nullableNumberFromInput(packageForm.the9pAmount),
      displayOrder: numberFromInput(packageForm.displayOrder),
      active: packageForm.active,
    };

    await saveEntity({
      path: editingId
        ? `/api/admin/service-packages/${editingId}`
        : "/api/admin/service-packages",
      method: editingId ? "PUT" : "POST",
      payload,
      successMessage: editingId ? "Da cap nhat goi dich vu." : "Da tao goi dich vu.",
      session,
      refreshPackagesOnly: true,
    });
  }

  async function saveEntity({
    path,
    method,
    payload,
    successMessage,
    session,
    refreshPackagesOnly = false,
  }: {
    path: string;
    method: "POST" | "PUT";
    payload: ServiceCategoryPayload | ServiceSubCategoryPayload | ServicePackagePayload;
    successMessage: string;
    session: AuthResponse;
    refreshPackagesOnly?: boolean;
  }) {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(path, {
        method,
        headers: {
          ...authHeaders(session),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await readResponseJson(response);

      if (!response.ok) {
        throw new Error(
          getAdminServiceErrorMessage(response, data, "Khong luu duoc du lieu."),
        );
      }

      setMessage(successMessage);
      closeModal();

      if (refreshPackagesOnly) {
        setPackages(
          normalizeList<ServicePackage>(
            await fetchPackageList(session, (payload as ServicePackagePayload).subCategoryId),
          ).sort((a, b) => a.displayOrder - b.displayOrder),
        );
        setSelectedSubCategoryId((payload as ServicePackagePayload).subCategoryId);
      } else {
        setRefreshKey((current) => current + 1);
      }
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Khong luu duoc du lieu.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEntity(
    kind: "category" | "subCategory" | "package",
    id: string,
    name: string,
    parentId = "",
  ) {
    if (!session) {
      return;
    }

    const labels = {
      category: "danh muc",
      subCategory: "dich vu",
      package: "goi dich vu",
    };
    const confirmed = window.confirm(`Xoa ${labels[kind]} ${name}?`);

    if (!confirmed) {
      return;
    }

    const path =
      kind === "category"
        ? `/api/admin/service-categories/${id}`
        : kind === "subCategory"
          ? `/api/admin/service-sub-categories/${id}?parentId=${encodeURIComponent(
              parentId,
            )}`
          : `/api/admin/service-packages/${id}?subCategoryId=${encodeURIComponent(
              parentId,
            )}`;

    setUpdatingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(path, {
        method: "DELETE",
        headers: authHeaders(session),
      });

      if (!response.ok) {
        const data = await readResponseJson(response);
        throw new Error(
          getAdminServiceErrorMessage(response, data, "Khong xoa duoc du lieu."),
        );
      }

      setMessage(`Da xoa ${name}.`);

      if (kind === "package") {
        setPackages((current) => current.filter((item) => item.id !== id));
      } else {
        setRefreshKey((current) => current + 1);
      }
    } catch (exception) {
      setError(
        exception instanceof Error ? exception.message : "Khong xoa duoc du lieu.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="services" />

      <section className="role-main backoffice-users-main admin-services-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <h1>Quản lý dịch vụ & gói</h1>
          </div>
          <div className="role-topbar-actions">
            <button
              className="primary-button h-11 px-5"
              disabled={isSyncingThe9p || isTestingThe9p || !canLoad}
              onClick={syncThe9pPackages}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={isSyncingThe9p ? "admin-the9p-spin" : undefined}
                size={16}
              />
              {isSyncingThe9p ? "Đang lấy gói..." : "Lấy gói từ The9P"}
            </button>
            <button
              className="ghost-button h-11 px-5"
              disabled={isTestingThe9p || isSyncingThe9p || !canLoad}
              onClick={testThe9pConnection}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={isTestingThe9p ? "admin-the9p-spin" : undefined}
                size={16}
              />
              {isTestingThe9p ? "Đang gọi The9P..." : "Kiểm tra The9P"}
            </button>
            <button
              className="ghost-button h-11 px-5"
              disabled={isLoadingCategories}
              onClick={refreshAll}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Tải lại
            </button>
            <button
              className="ghost-button h-11 px-5"
              onClick={() => openCreateSubCategory()}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Dịch vụ
            </button>
            <button
              className="primary-button h-11 px-5"
              onClick={() => openCreatePackage()}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Gói
            </button>
          </div>
        </header>

        {message ? <p className="admin-users-message success">{message}</p> : null}
        {error ? <p className="admin-users-message error">{error}</p> : null}

        {the9pTestResult ? (
          <section
            className={`role-panel admin-the9p-test-result ${
              the9pTestResult.ok ? "success" : "error"
            }`}
          >
            <div className="admin-the9p-test-head">
              <div>
                <p className="section-kicker">BE → The9P · productlist</p>
                <h2>
                  {the9pTestResult.ok
                    ? "The9P đã trả kết quả"
                    : "Kiểm tra The9P thất bại"}
                </h2>
              </div>
              <button
                aria-label="Đóng kết quả kiểm tra The9P"
                className="ghost-button h-9 px-3"
                onClick={() => setThe9pTestResult(null)}
                type="button"
              >
                <X aria-hidden="true" size={15} />
                Đóng
              </button>
            </div>
            <div className="admin-the9p-test-meta">
              <span>HTTP: {the9pTestResult.status || "Không có phản hồi"}</span>
              <span>Thời gian: {the9pTestResult.durationMs} ms</span>
              <span>
                Sản phẩm: {the9pTestResult.productCount ?? "Không xác định"}
              </span>
              <span>
                Kiểm tra lúc: {formatDateTime(the9pTestResult.checkedAt)}
              </span>
            </div>
            <pre>{JSON.stringify(the9pTestResult.data, null, 2)}</pre>
          </section>
        ) : null}

        <section className="admin-services-layout">
          <div className="role-panel admin-services-tree">
            <div className="role-panel-head">
              <div>
                <h2>Danh mục dịch vụ</h2>
              </div>
              <button
                className="ghost-button h-9 px-3"
                onClick={openCreateCategory}
                type="button"
              >
                <Plus aria-hidden="true" size={15} />
                Danh mục
              </button>
            </div>

            <div className="admin-service-list">
              {categories.map((category) => (
                <article className="admin-service-card" key={category.id}>
                  <div className="admin-service-card-head">
                    <div>
                      <strong>{category.name}</strong>
                      <span>{category.children.length} dịch vụ</span>
                    </div>
                    <StatusPill active={category.active} />
                  </div>
                  <p>{category.description ?? "Chua co mo ta."}</p>
                  <div className="admin-services-actions">
                    <button
                      className="ghost-button h-9 px-3"
                      onClick={() => openCreateSubCategory(category.id)}
                      type="button"
                    >
                      <Plus aria-hidden="true" size={14} />
                      Dịch vụ
                    </button>
                    <button
                      className="ghost-button h-9 px-3"
                      onClick={() => openEditCategory(category)}
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={14} />
                      Sửa
                    </button>
                    <button
                      className="danger-button h-9 px-3"
                      disabled={updatingId === category.id}
                      onClick={() =>
                        deleteEntity("category", category.id, category.name)
                      }
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={14} />
                      Xóa
                    </button>
                  </div>
                  <div className="admin-subcategory-list">
                    {category.children.map((child) => (
                      <button
                        className={
                          child.id === selectedSubCategoryId
                            ? "admin-subcategory-row active"
                            : "admin-subcategory-row"
                        }
                        key={child.id}
                        onClick={() => setSelectedSubCategoryId(child.id)}
                        type="button"
                      >
                        <span>
                          <strong>{child.name}</strong>
                          <small>{child.type}</small>
                        </span>
                        <StatusPill active={child.active} />
                      </button>
                    ))}
                  </div>
                </article>
              ))}
              {!isLoadingCategories && categories.length === 0 ? (
                <div className="admin-services-empty">
                  Chưa có danh mục dịch vụ.
                </div>
              ) : null}
            </div>
          </div>

          <div className="role-panel role-table-panel backoffice-table-card admin-packages-panel">
            <div className="role-panel-head admin-packages-head">
              <div>
                <p className="section-kicker">
                  {selectedSubCategory?.categoryName ?? "Chưa chọn dịch vụ"}
                </p>
                <h2>{selectedSubCategory?.name ?? "Gói dịch vụ"}</h2>
              </div>
              <div className="admin-services-actions">
                {selectedSubCategory ? (
                  <button
                    className="ghost-button h-9 px-3"
                    onClick={() => openEditSubCategory(selectedSubCategory)}
                    type="button"
                  >
                    <Pencil aria-hidden="true" size={14} />
                    Sửa dịch vụ
                  </button>
                ) : null}
                {selectedSubCategory ? (
                  <button
                    className="danger-button h-9 px-3"
                    disabled={updatingId === selectedSubCategory.id}
                    onClick={() =>
                      deleteEntity(
                        "subCategory",
                        selectedSubCategory.id,
                        selectedSubCategory.name,
                        selectedSubCategory.parentId,
                      )
                    }
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                    Xóa dịch vụ
                  </button>
                ) : null}
                <button
                  className="primary-button h-9 px-3"
                  disabled={!selectedSubCategoryId}
                  onClick={() => openCreatePackage()}
                  type="button"
                >
                  <Plus aria-hidden="true" size={14} />
                  Thêm gói
                </button>
              </div>
            </div>

            <div className="admin-service-meta">
              <p>
                <strong>Form fields</strong>
                <span>
                  {selectedSubCategory?.requiredFormFields.length
                    ? selectedSubCategory.requiredFormFields.join(", ")
                    : "Không yêu cầu"}
                </span>
              </p>
              <p>
                <strong>Mã 9P</strong>
                <span>{selectedSubCategory?.the9pServiceCode ?? "Chưa gắn"}</span>
              </p>
            </div>

            <div className="admin-package-list">
              <div className="admin-package-list-head" aria-hidden="true">
                <span>Gói</span>
                <span>Giá</span>
                <span>9P amount</span>
                <span>Thứ tự</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
              </div>
              {packages.map((item) => (
                <article className="admin-package-row" key={item.id}>
                  <div className="admin-package-main">
                    <strong>{item.name}</strong>
                    <small>{item.description ?? item.id}</small>
                  </div>
                  <div className="admin-package-price">
                    <strong>{formatVnd(item.price)}</strong>
                    {item.originalPrice ? (
                      <small>{formatVnd(item.originalPrice)}</small>
                    ) : null}
                  </div>
                  <span>{item.the9pAmount ?? "Tuỳ chỉnh"}</span>
                  <span>{item.displayOrder}</span>
                  <StatusPill active={item.active} />
                  <div className="admin-package-actions">
                    <button
                      className="ghost-button h-9 px-3"
                      onClick={() => openEditPackage(item)}
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={15} />
                      Sửa
                    </button>
                    <button
                      className="danger-button h-9 px-3"
                      disabled={updatingId === item.id}
                      onClick={() =>
                        deleteEntity(
                          "package",
                          item.id,
                          item.name,
                          item.subCategoryId,
                        )
                      }
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
              {!isLoadingPackages && packages.length === 0 ? (
                <div className="admin-services-empty">
                  Chưa có gói dịch vụ trong mục này.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </section>

      {modalMode && typeof document !== "undefined"
        ? createPortal(
            <div className="admin-user-modal" role="presentation">
              <button
                aria-label="Dong form quan ly dich vu"
                className="admin-user-modal-backdrop"
                onClick={closeModal}
                type="button"
              />
              <section
                aria-modal="true"
                className={
                  modalMode === "package"
                    ? "admin-user-modal-panel admin-package-modal-panel"
                    : "admin-user-modal-panel"
                }
                role="dialog"
              >
                <div className="admin-user-modal-header">
                  <div>
                    <h2>{getModalTitle(modalMode, Boolean(editingId))}</h2>
                    <p>Thông tin sẽ được gửi về backend shop-game.</p>
                  </div>
                  <button
                    aria-label="Dong form"
                    className="admin-user-modal-close"
                    onClick={closeModal}
                    type="button"
                  >
                    <X aria-hidden="true" size={18} />
                  </button>
                </div>

                {modalMode === "category" ? (
                  <CategoryFormView
                    form={categoryForm}
                    isSaving={isSaving}
                    onCancel={closeModal}
                    onChange={setCategoryForm}
                    onSubmit={submitCategory}
                  />
                ) : null}

                {modalMode === "subCategory" ? (
                  <SubCategoryFormView
                    categories={categories}
                    form={subCategoryForm}
                    isSaving={isSaving}
                    isUploadingImage={isUploadingImage}
                    onCancel={closeModal}
                    onChange={setSubCategoryForm}
                    onSubmit={submitSubCategory}
                    onUploadImage={uploadServiceImage}
                  />
                ) : null}

                {modalMode === "package" ? (
                  <PackageFormView
                    form={packageForm}
                    isSaving={isSaving}
                    onCancel={closeModal}
                    onChange={setPackageForm}
                    onSubmit={submitPackage}
                    subCategories={subCategories}
                  />
                ) : null}
              </section>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}

function CategoryFormView({
  form,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
}: {
  form: CategoryForm;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (form: CategoryForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="admin-user-form" onSubmit={onSubmit}>
      <div className="admin-user-form-content">
        <label className="field-label">
          Tên danh mục
          <input
            className="text-field"
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            required
            value={form.name}
          />
        </label>
        <label className="field-label">
          Thứ tự
          <input
            className="text-field"
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...form, displayOrder: normalizeIntegerInput(event.target.value) })
            }
            type="text"
            value={formatIntegerInput(form.displayOrder)}
          />
        </label>
        <label className="field-label admin-form-span-2 admin-package-description">
          Mô tả
          <textarea
            className="text-field admin-textarea"
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
            required
            value={form.description}
          />
        </label>
        <label className="admin-check-field">
          <input
            checked={form.active}
            onChange={(event) => onChange({ ...form, active: event.target.checked })}
            type="checkbox"
          />
          Đang hoạt động
        </label>
      </div>
      <ModalActions isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}

function SubCategoryFormView({
  categories,
  form,
  isSaving,
  isUploadingImage,
  onCancel,
  onChange,
  onSubmit,
  onUploadImage,
}: {
  categories: ServiceCategory[];
  form: SubCategoryForm;
  isSaving: boolean;
  isUploadingImage: boolean;
  onCancel: () => void;
  onChange: (form: SubCategoryForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUploadImage: (file: File) => void;
}) {
  return (
    <form className="admin-user-form" onSubmit={onSubmit}>
      <div className="admin-user-form-content">
        <label className="field-label">
          Danh mục cha
          <select
            className="role-select wide"
            onChange={(event) =>
              onChange({ ...form, parentId: event.target.value })
            }
            required
            value={form.parentId}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Loại dịch vụ
          <select
            className="role-select wide"
            onChange={(event) => onChange({ ...form, type: event.target.value })}
            value={form.type}
          >
            {serviceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Tên dịch vụ
          <input
            className="text-field"
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            required
            value={form.name}
          />
        </label>
        <label className="field-label">
          Thứ tự
          <input
            className="text-field"
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...form, displayOrder: normalizeIntegerInput(event.target.value) })
            }
            type="text"
            value={formatIntegerInput(form.displayOrder)}
          />
        </label>
        <label className="field-label">
          Số gói/dịch vụ
          <input
            className="text-field"
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...form, serviceCount: normalizeIntegerInput(event.target.value) })
            }
            type="text"
            value={formatIntegerInput(form.serviceCount ?? "0")}
          />
        </label>
        <label className="field-label">
          Mã dịch vụ 9P
          <input
            className="text-field"
            onChange={(event) =>
              onChange({ ...form, the9pServiceCode: event.target.value })
            }
            value={form.the9pServiceCode}
          />
        </label>
        <div className="field-label admin-form-span-2">
          Ảnh đại diện dịch vụ
          <div className="admin-service-image-field">
            <div
              className={
                form.imageUrl
                  ? "admin-service-image-preview has-image"
                  : "admin-service-image-preview"
              }
              style={
                form.imageUrl
                  ? { backgroundImage: `url(${JSON.stringify(form.imageUrl)})` }
                  : undefined
              }
            >
              {!form.imageUrl ? <ImageUp aria-hidden="true" size={28} /> : null}
            </div>
            <div className="admin-service-image-controls">
              <p>Ảnh này dùng cho thẻ dịch vụ trên trang chủ. Gói giá không có ảnh riêng.</p>
              <label className="ghost-button h-10 px-4 admin-image-upload-button">
                <ImageUp aria-hidden="true" size={16} />
                {isUploadingImage ? "Đang tải ảnh..." : "Chọn ảnh"}
                <input
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingImage || isSaving}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onUploadImage(file);
                    event.currentTarget.value = "";
                  }}
                  type="file"
                />
              </label>
              {form.imageUrl ? (
                <button
                  className="danger-button h-10 px-4"
                  disabled={isUploadingImage || isSaving}
                  onClick={() => onChange({ ...form, imageUrl: "" })}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                  Bỏ ảnh
                </button>
              ) : null}
              <small>JPG, PNG hoặc WEBP — tối đa 5 MB.</small>
            </div>
          </div>
        </div>
        <label className="field-label admin-form-span-2">
          Mô tả
          <textarea
            className="text-field admin-textarea"
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
            required
            value={form.description}
          />
        </label>
        <label className="admin-check-field">
          <input
            checked={form.active}
            onChange={(event) => onChange({ ...form, active: event.target.checked })}
            type="checkbox"
          />
          Đang hoạt động
        </label>
      </div>
      <ModalActions isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}

function PackageFormView({
  form,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
  subCategories,
}: {
  form: PackageForm;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (form: PackageForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  subCategories: Array<ServiceSubCategory & { categoryName: string }>;
}) {
  return (
    <form className="admin-user-form admin-package-form" onSubmit={onSubmit}>
      <div className="admin-user-form-content">
        <label className="field-label admin-form-span-2">
          Dịch vụ
          <select
            className="role-select wide"
            onChange={(event) =>
              onChange({ ...form, subCategoryId: event.target.value })
            }
            required
            value={form.subCategoryId}
          >
            <option value="">Chọn dịch vụ</option>
            {subCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.categoryName} / {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label admin-form-span-2">
          Tên gói
          <input
            className="text-field"
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            required
            value={form.name}
          />
        </label>
        <label className="field-label">
          Giá bán
          <input
            className="text-field"
            inputMode="numeric"
            onChange={(event) => onChange({ ...form, price: normalizeIntegerInput(event.target.value) })}
            required
            type="text"
            value={formatIntegerInput(form.price)}
          />
        </label>
        <label className="field-label">
          Giá gốc
          <input
            className="text-field"
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...form, originalPrice: normalizeIntegerInput(event.target.value) })
            }
            type="text"
            value={formatIntegerInput(form.originalPrice)}
          />
        </label>
        <label className="field-label">
          9P amount
          <input
            className="text-field"
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...form, the9pAmount: normalizeIntegerInput(event.target.value) })
            }
            type="text"
            value={formatIntegerInput(form.the9pAmount)}
          />
        </label>
        <label className="field-label">
          Thứ tự
          <input
            className="text-field"
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...form, displayOrder: normalizeIntegerInput(event.target.value) })
            }
            type="text"
            value={formatIntegerInput(form.displayOrder)}
          />
        </label>
        <label className="field-label admin-form-span-2">
          Mô tả
          <textarea
            className="text-field admin-textarea"
            onChange={(event) =>
              onChange({ ...form, description: event.target.value })
            }
            required
            value={form.description}
          />
        </label>
        <label className="admin-check-field">
          <input
            checked={form.active}
            onChange={(event) => onChange({ ...form, active: event.target.checked })}
            type="checkbox"
          />
          Đang hoạt động
        </label>
      </div>
      <ModalActions isSaving={isSaving} onCancel={onCancel} />
    </form>
  );
}

function ModalActions({
  isSaving,
  onCancel,
}: {
  isSaving: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="admin-user-modal-actions">
      <button className="ghost-button h-11 px-5" onClick={onCancel} type="button">
        Hủy
      </button>
      <button className="primary-button h-11 px-5" disabled={isSaving} type="submit">
        {isSaving ? "Đang lưu..." : "Lưu"}
      </button>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={active ? "admin-status-pill active" : "admin-status-pill"}>
      {active ? "Active" : "Tắt"}
    </span>
  );
}

function getModalTitle(mode: ModalMode, isEditing: boolean) {
  if (mode === "category") {
    return isEditing ? "Sửa danh mục" : "Tạo danh mục";
  }

  if (mode === "subCategory") {
    return isEditing ? "Sửa dịch vụ" : "Tạo dịch vụ";
  }

  return isEditing ? "Sửa gói dịch vụ" : "Tạo gói dịch vụ";
}

async function fetchPackageList(session: AuthResponse, subCategoryId: string) {
  const response = await fetch(
    `/api/admin/service-sub-categories/${subCategoryId}/packages`,
    { headers: authHeaders(session) },
  );
  const data = await readResponseJson(response);

  if (response.ok) {
    return data;
  }

  if (response.status === 404) {
    const fallbackResponse = await fetch(
      `/api/admin/service-packages?subCategoryId=${encodeURIComponent(
        subCategoryId,
      )}`,
      { headers: authHeaders(session) },
    );
    const fallbackData = await readResponseJson(fallbackResponse);

    if (fallbackResponse.ok) {
      return fallbackData;
    }

    throw new Error(
      getAdminServiceErrorMessage(
        fallbackResponse,
        fallbackData,
        "Khong tai duoc goi dich vu.",
      ),
    );
  }

  throw new Error(
    getAdminServiceErrorMessage(response, data, "Khong tai duoc goi dich vu."),
  );
}

function getAdminServiceErrorMessage(
  response: Response,
  data: unknown,
  fallback: string,
) {
  if (response.status === 401) {
    return "Phien dang nhap het han hoac token khong hop le. Hay dang nhap lai bang tai khoan admin.";
  }

  if (response.status === 403) {
    return "Backend tu choi quyen 403. Tai khoan hien tai chua co quyen ADMIN cho API dich vu, hoac endpoint BE dang map sai.";
  }

  return getApiErrorMessage(data, fallback);
}

function normalizeList<T>(data: unknown) {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === "object" && Array.isArray((data as PageResponse<T>).content)) {
    return (data as PageResponse<T>).content;
  }

  return [];
}

function authHeaders(session: AuthResponse) {
  return {
    Authorization: `${session.tokenType} ${session.token}`,
  };
}

async function readResponseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function textOrNull(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function numberFromInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumberFromInput(value: string) {
  if (!value.trim()) {
    return null;
  }

  return numberFromInput(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}
