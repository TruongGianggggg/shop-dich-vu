"use client";

import {
  ImageUp,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

type ServicesView = "parents" | "children";
const ALL_PARENT_CATEGORIES = "__all_parent_categories__";
const ADMIN_TABLE_PAGE_SIZE = 10;

export function AdminServicesManager({
  view = "parents",
  initialCategoryId = "",
}: {
  view?: ServicesView;
  initialCategoryId?: string;
}) {
  const session = useAuthSession();
  const initialParentSelection =
    view === "children" && !initialCategoryId
      ? ALL_PARENT_CATEGORIES
      : initialCategoryId;
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedParentId, setSelectedParentId] = useState(
    initialParentSelection,
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [childSearch, setChildSearch] = useState("");
  const [showPackages, setShowPackages] = useState(false);
  const [parentPage, setParentPage] = useState(1);
  const [childPage, setChildPage] = useState(1);
  const selectedParentIdRef = useRef(initialParentSelection);
  const selectedSubCategoryIdRef = useRef("");
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
  const selectedParent =
    categories.find((category) => category.id === selectedParentId) ?? null;
  const visibleSubCategories = useMemo(
    () =>
      selectedParentId === ALL_PARENT_CATEGORIES
        ? subCategories
        : (selectedParent?.children ?? []),
    [selectedParent, selectedParentId, subCategories],
  );
  const filteredSubCategories = useMemo(() => {
    const keyword = childSearch.trim().toLocaleLowerCase("vi");

    if (!keyword) {
      return visibleSubCategories;
    }

    return visibleSubCategories.filter((item) =>
      [item.name, item.type, item.the9pServiceCode ?? ""]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(keyword),
    );
  }, [childSearch, visibleSubCategories]);
  const parentTotalPages = Math.max(
    1,
    Math.ceil(categories.length / ADMIN_TABLE_PAGE_SIZE),
  );
  const currentParentPage = Math.min(parentPage, parentTotalPages);
  const paginatedCategories = categories.slice(
    (currentParentPage - 1) * ADMIN_TABLE_PAGE_SIZE,
    currentParentPage * ADMIN_TABLE_PAGE_SIZE,
  );
  const childTotalPages = Math.max(
    1,
    Math.ceil(filteredSubCategories.length / ADMIN_TABLE_PAGE_SIZE),
  );
  const currentChildPage = Math.min(childPage, childTotalPages);
  const paginatedSubCategories = filteredSubCategories.slice(
    (currentChildPage - 1) * ADMIN_TABLE_PAGE_SIZE,
    currentChildPage * ADMIN_TABLE_PAGE_SIZE,
  );

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
        const response = await fetch(serviceCategoryPath(), {
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
        if (view === "children") {
          if (selectedParentIdRef.current === ALL_PARENT_CATEGORIES) {
            setSelectedParentId(ALL_PARENT_CATEGORIES);

            const allChildren = nextCategories.flatMap(
              (category) => category.children,
            );
            if (
              !allChildren.some(
                (child) => child.id === selectedSubCategoryIdRef.current,
              )
            ) {
              selectedSubCategoryIdRef.current = "";
              setSelectedSubCategoryId("");
              setPackages([]);
              setShowPackages(false);
            }
            return;
          }

          const nextParent =
            nextCategories.find(
              (category) => category.id === selectedParentIdRef.current,
            ) ??
            nextCategories.find((category) => category.id === initialCategoryId) ??
            nextCategories[0];
          const nextParentId = nextParent?.id ?? "";
          selectedParentIdRef.current = nextParentId;
          setSelectedParentId(nextParentId);

          if (
            !nextParent?.children.some(
              (child) => child.id === selectedSubCategoryIdRef.current,
            )
          ) {
            const nextChildId = nextParent?.children[0]?.id ?? "";
            selectedSubCategoryIdRef.current = nextChildId;
            setSelectedSubCategoryId(nextChildId);
            setPackages([]);
          }
        }
      } catch (exception) {
        if (!ignore) {
          setCategories([]);
          selectedSubCategoryIdRef.current = "";
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
  }, [canLoad, initialCategoryId, refreshKey, session, view]);

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
      const response = await fetch("/api/the9p/recharge-products", {
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
            "Nhà cung cấp không trả về kết quả hợp lệ.",
          ),
        );
        return;
      }

      setMessage(
        `Kết nối nhà cung cấp thành công, nhận được ${result.productCount ?? 0} sản phẩm.`,
      );
    } catch (exception) {
      const data = {
        message:
          exception instanceof Error
            ? exception.message
            : "Không gọi được API kiểm tra nhà cung cấp.",
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
      const response = await fetch("/api/the9p/sync-packages", {
        method: "POST",
        headers: authHeaders(session),
      });
      const data = await readResponseJson(response);

      if (!response.ok) {
        setError(
          getAdminServiceErrorMessage(
            response,
            data,
            "Không đồng bộ được sản phẩm từ nhà cung cấp.",
          ),
        );
        return;
      }

      const result = data as The9pSyncResult;
      setMessage(
        `Đã lấy ${result.productCount} sản phẩm từ nhà cung cấp: tạo ${result.subCategoriesCreated} danh mục, tạo ${result.packagesCreated} gói, cập nhật ${result.packagesUpdated} gói${result.packagesDisabled ? `, ngừng bán ${result.packagesDisabled} gói` : ""}.`,
      );
      setRefreshKey((current) => current + 1);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Không gọi được API đồng bộ nhà cung cấp.",
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
      path: serviceCategoryPath(editingId),
      method: editingId ? "PUT" : "POST",
      payload,
      successMessage: editingId ? "Da cap nhat danh muc." : "Da tao danh muc.",
      session,
    });
  }

  async function updateCategoryInline(
    category: ServiceCategory,
    changes: Partial<Pick<ServiceCategory, "active" | "displayOrder">>,
  ) {
    if (!session || updatingId === category.id) {
      return;
    }

    const nextCategory = { ...category, ...changes };
    const payload: ServiceCategoryPayload = {
      name: nextCategory.name,
      description: nextCategory.description ?? "",
      displayOrder: nextCategory.displayOrder,
      active: nextCategory.active,
    };

    setUpdatingId(category.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        serviceCategoryPath(category.id),
        {
          method: "PUT",
          headers: {
            ...authHeaders(session),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await readResponseJson(response);

      if (!response.ok) {
        throw new Error(
          getAdminServiceErrorMessage(
            response,
            data,
            "Không cập nhật được danh mục.",
          ),
        );
      }

      setCategories((current) =>
        current
          .map((item) => (item.id === category.id ? nextCategory : item))
          .sort((a, b) => a.displayOrder - b.displayOrder),
      );
      setMessage(`Đã cập nhật danh mục ${category.name}.`);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Không cập nhật được danh mục.",
      );
      setRefreshKey((current) => current + 1);
    } finally {
      setUpdatingId("");
    }
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
      path: serviceSubCategoryPath(payload.parentId, editingId),
      method: editingId ? "PUT" : "POST",
      payload,
      successMessage: editingId ? "Da cap nhat dich vu." : "Da tao dich vu.",
      session,
    });
  }

  async function updateSubCategoryInline(
    subCategory: ServiceSubCategory,
    changes: Partial<Pick<ServiceSubCategory, "active" | "displayOrder">>,
  ) {
    if (!session || updatingId === subCategory.id) {
      return;
    }

    const nextSubCategory = { ...subCategory, ...changes };
    const payload: ServiceSubCategoryPayload = {
      parentId: nextSubCategory.parentId,
      name: nextSubCategory.name,
      description: nextSubCategory.description,
      imageUrl: nextSubCategory.imageUrl,
      type: nextSubCategory.type,
      the9pServiceCode: nextSubCategory.the9pServiceCode,
      displayOrder: nextSubCategory.displayOrder,
      serviceCount: nextSubCategory.serviceCount,
      active: nextSubCategory.active,
    };

    setUpdatingId(subCategory.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        serviceSubCategoryPath(subCategory.parentId, subCategory.id),
        {
          method: "PUT",
          headers: {
            ...authHeaders(session),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await readResponseJson(response);

      if (!response.ok) {
        throw new Error(
          getAdminServiceErrorMessage(
            response,
            data,
            "Không cập nhật được danh mục con.",
          ),
        );
      }

      setCategories((current) =>
        current.map((category) =>
          category.id === subCategory.parentId
            ? {
                ...category,
                children: category.children
                  .map((item) =>
                    item.id === subCategory.id ? nextSubCategory : item,
                  )
                  .sort((a, b) => a.displayOrder - b.displayOrder),
              }
            : category,
        ),
      );
      setMessage(`Đã cập nhật danh mục con ${subCategory.name}.`);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Không cập nhật được danh mục con.",
      );
      setRefreshKey((current) => current + 1);
    } finally {
      setUpdatingId("");
    }
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
      path: servicePackagePath(payload.subCategoryId, editingId),
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
        const packageSubCategoryId = (payload as ServicePackagePayload).subCategoryId;
        selectedSubCategoryIdRef.current = packageSubCategoryId;
        setSelectedSubCategoryId(packageSubCategoryId);
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
        ? serviceCategoryPath(id)
        : kind === "subCategory"
          ? serviceSubCategoryPath(parentId, id)
          : servicePackagePath(parentId, id);

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

  function selectParent(parentId: string) {
    selectedParentIdRef.current = parentId;
    setSelectedParentId(parentId);
    const nextChildId =
      categories.find((category) => category.id === parentId)?.children[0]?.id ?? "";
    selectedSubCategoryIdRef.current = nextChildId;
    setSelectedSubCategoryId(nextChildId);
    setPackages([]);
    setShowPackages(false);
    setChildPage(1);
  }

  function selectSubCategory(subCategoryId: string) {
    selectedSubCategoryIdRef.current = subCategoryId;
    setSelectedSubCategoryId(subCategoryId);
  }

  function openPackages(subCategoryId: string) {
    selectSubCategory(subCategoryId);
    setShowPackages(true);
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar
        active={
          view === "parents"
            ? "service-categories"
            : "service-sub-categories"
        }
      />

      <section className="role-main backoffice-users-main admin-services-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <div>
              <p className="section-kicker">DỊCH VỤ CỬA HÀNG</p>
              <h1>
                {view === "parents"
                  ? "Danh mục cha"
                  : "Danh mục con"}
              </h1>
            </div>
          </div>
          <div className="role-topbar-actions">
            {view === "children" ? (
              <>
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
                  {isSyncingThe9p ? "Đang lấy gói..." : "Lấy gói từ nhà cung cấp"}
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
                  {isTestingThe9p ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                </button>
              </>
            ) : null}
            {view === "children" ? (
              <button
                className="ghost-button h-11 px-5"
                disabled={isLoadingCategories}
                onClick={refreshAll}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={16} />
                Tải lại
              </button>
            ) : null}
            {view === "parents" ? (
              <button
                className="primary-button admin-category-add-button h-11 px-5"
                onClick={openCreateCategory}
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                Thêm danh mục
              </button>
            ) : (
              <>
                <button
                  className="primary-button admin-category-add-button h-11 px-5"
                  disabled={categories.length === 0}
                  onClick={() =>
                    openCreateSubCategory(
                      selectedParentId === ALL_PARENT_CATEGORIES
                        ? categories[0]?.id
                        : selectedParentId,
                    )
                  }
                  type="button"
                >
                  <Plus aria-hidden="true" size={16} />
                  Thêm danh mục con
                </button>
              </>
            )}
          </div>
        </header>

        {message ? <p className="admin-users-message success">{message}</p> : null}
        {error ? <p className="admin-users-message error">{error}</p> : null}

        {view === "children" && the9pTestResult ? (
          <section
            className={`role-panel admin-the9p-test-result ${
              the9pTestResult.ok ? "success" : "error"
            }`}
          >
            <div className="admin-the9p-test-head">
              <div>
                <p className="section-kicker">BE → Nhà cung cấp · productlist</p>
                <h2>
                  {the9pTestResult.ok
                    ? "Nhà cung cấp đã trả kết quả"
                    : "Kiểm tra nhà cung cấp thất bại"}
                </h2>
              </div>
              <button
                aria-label="Đóng kết quả kiểm tra nhà cung cấp"
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

        {view === "parents" ? (
          <section className="role-panel admin-parent-categories-panel">
            <div className="admin-category-table-title">
              <h2>Danh mục ({categories.length})</h2>
            </div>
            <div className="admin-category-table-wrap">
              <table className="admin-category-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Sự ưu tiên</th>
                    <th>Trạng thái</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <span
                          className="admin-category-id"
                          title={category.id}
                        >
                          {category.id.slice(0, 8)}
                        </span>
                      </td>
                      <td>
                        <strong className="admin-category-name">
                          {category.name}
                        </strong>
                      </td>
                      <td>
                        <input
                          aria-label={`Sự ưu tiên của ${category.name}`}
                          className="admin-category-order-input"
                          defaultValue={category.displayOrder}
                          disabled={updatingId === category.id}
                          key={`${category.id}-${category.displayOrder}`}
                          min="0"
                          onBlur={(event) => {
                            const displayOrder = numberFromInput(
                              event.currentTarget.value,
                            );
                            if (displayOrder !== category.displayOrder) {
                              void updateCategoryInline(category, {
                                displayOrder,
                              });
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur();
                            }
                          }}
                          type="number"
                        />
                      </td>
                      <td>
                        <label className="admin-category-switch">
                          <input
                            aria-label={`Trạng thái của ${category.name}`}
                            checked={category.active}
                            disabled={updatingId === category.id}
                            onChange={(event) =>
                              void updateCategoryInline(category, {
                                active: event.currentTarget.checked,
                              })
                            }
                            type="checkbox"
                          />
                          <span aria-hidden="true" />
                        </label>
                      </td>
                      <td>
                        <div className="admin-category-icon-actions">
                          <button
                            aria-label={`Sửa ${category.name}`}
                            className="admin-category-icon-button"
                            onClick={() => openEditCategory(category)}
                            title="Sửa"
                            type="button"
                          >
                            <Pencil aria-hidden="true" size={17} />
                          </button>
                          <button
                            aria-label={`Xóa ${category.name}`}
                            className="admin-category-icon-button danger"
                            disabled={updatingId === category.id}
                            onClick={() =>
                              deleteEntity(
                                "category",
                                category.id,
                                category.name,
                              )
                            }
                            title="Xóa"
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoadingCategories && categories.length === 0 ? (
                    <tr>
                      <td className="admin-category-empty" colSpan={5}>
                        Chưa có danh mục cha.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <AdminTablePagination
              currentPage={currentParentPage}
              onPageChange={setParentPage}
              pageSize={ADMIN_TABLE_PAGE_SIZE}
              totalItems={categories.length}
            />
          </section>
        ) : (
          <>
            <section className="role-panel admin-child-filter-panel">
              <label>
                <span>Danh mục cha</span>
                <select
                  className="role-select wide"
                  onChange={(event) => selectParent(event.target.value)}
                  value={selectedParentId}
                >
                  <option value={ALL_PARENT_CATEGORIES}>
                    Tất cả danh mục cha ({subCategories.length})
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.children.length})
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-child-search-field">
                <span>Tìm kiếm</span>
                <input
                  onChange={(event) => {
                    setChildSearch(event.target.value);
                    setChildPage(1);
                  }}
                  placeholder="Tên, loại hoặc mã nhà cung cấp..."
                  type="search"
                  value={childSearch}
                />
              </label>
            </section>

            <section className="role-panel admin-child-categories-panel">
              <div className="admin-category-table-title">
                <h2>
                  Danh sách danh mục con ({filteredSubCategories.length})
                </h2>
              </div>
              <div className="admin-child-table-wrap">
                <table className="admin-child-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ảnh</th>
                      <th>Tên</th>
                      <th>Danh mục cha</th>
                      <th>Loại / Mã nhà cung cấp</th>
                      <th>Số gói</th>
                      <th>Sự ưu tiên</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubCategories.map((child) => (
                      <tr key={child.id}>
                        <td>
                          <span
                            className="admin-category-id"
                            title={child.id}
                          >
                            {child.id.slice(0, 8)}
                          </span>
                        </td>
                        <td>
                          <div
                            className={
                              child.imageUrl
                                ? "admin-child-image has-image"
                                : "admin-child-image"
                            }
                            style={
                              child.imageUrl
                                ? {
                                    backgroundImage: `url(${JSON.stringify(child.imageUrl)})`,
                                  }
                                : undefined
                            }
                          >
                            {!child.imageUrl ? (
                              <ImageUp aria-hidden="true" size={20} />
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="admin-child-name-cell">
                            <strong>{child.name}</strong>
                            <small>{child.description ?? "Chưa có mô tả"}</small>
                          </div>
                        </td>
                        <td>
                          <span className="admin-child-parent-badge">
                            {categories.find(
                              (category) => category.id === child.parentId,
                            )?.name ?? "—"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-child-code-cell">
                            <strong>{serviceTypeLabel(child.type)}</strong>
                            <small>{child.the9pServiceCode ?? "Chưa gắn mã"}</small>
                          </div>
                        </td>
                        <td>
                          <strong>{child.serviceCount}</strong>
                        </td>
                        <td>
                          <input
                            aria-label={`Sự ưu tiên của ${child.name}`}
                            className="admin-category-order-input"
                            defaultValue={child.displayOrder}
                            disabled={updatingId === child.id}
                            key={`${child.id}-${child.displayOrder}`}
                            min="0"
                            onBlur={(event) => {
                              const displayOrder = numberFromInput(
                                event.currentTarget.value,
                              );
                              if (displayOrder !== child.displayOrder) {
                                void updateSubCategoryInline(child, {
                                  displayOrder,
                                });
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.currentTarget.blur();
                              }
                            }}
                            type="number"
                          />
                        </td>
                        <td>
                          <label className="admin-category-switch">
                            <input
                              aria-label={`Trạng thái của ${child.name}`}
                              checked={child.active}
                              disabled={updatingId === child.id}
                              onChange={(event) =>
                                void updateSubCategoryInline(child, {
                                  active: event.currentTarget.checked,
                                })
                              }
                              type="checkbox"
                            />
                            <span aria-hidden="true" />
                          </label>
                        </td>
                        <td>
                          <div className="admin-child-actions">
                            <button
                              className="admin-child-packages-button"
                              onClick={() => openPackages(child.id)}
                              type="button"
                            >
                              <List aria-hidden="true" size={15} />
                              Xem gói
                            </button>
                            <button
                              aria-label={`Sửa ${child.name}`}
                              className="admin-category-icon-button"
                              onClick={() => openEditSubCategory(child)}
                              title="Sửa"
                              type="button"
                            >
                              <Pencil aria-hidden="true" size={17} />
                            </button>
                            <button
                              aria-label={`Xóa ${child.name}`}
                              className="admin-category-icon-button danger"
                              disabled={updatingId === child.id}
                              onClick={() =>
                                deleteEntity(
                                  "subCategory",
                                  child.id,
                                  child.name,
                                  child.parentId,
                                )
                              }
                              title="Xóa"
                              type="button"
                            >
                              <Trash2 aria-hidden="true" size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingCategories &&
                    filteredSubCategories.length === 0 ? (
                      <tr>
                        <td className="admin-category-empty" colSpan={9}>
                          {childSearch
                            ? "Không tìm thấy danh mục con phù hợp."
                            : "Danh mục cha này chưa có danh mục con."}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <AdminTablePagination
                currentPage={currentChildPage}
                onPageChange={setChildPage}
                pageSize={ADMIN_TABLE_PAGE_SIZE}
                totalItems={filteredSubCategories.length}
              />
            </section>

            {showPackages &&
            selectedSubCategory &&
            typeof document !== "undefined"
              ? createPortal(
                  <div
                    className="admin-child-packages-modal"
                    role="presentation"
                  >
                    <button
                      aria-label="Đóng danh sách gói"
                      className="admin-child-packages-modal-backdrop"
                      onClick={() => setShowPackages(false)}
                      type="button"
                    />
                    <section
                      aria-labelledby="admin-child-packages-title"
                      aria-modal="true"
                      className="role-panel role-table-panel backoffice-table-card admin-packages-panel admin-child-packages-panel"
                      role="dialog"
                    >
                <div className="role-panel-head admin-packages-head">
                  <div>
                    <p className="section-kicker">
                      {selectedSubCategory?.categoryName ?? "Chưa chọn danh mục con"}
                    </p>
                    <h2 id="admin-child-packages-title">
                      {selectedSubCategory?.name ?? "Danh sách gói"}
                    </h2>
                  </div>
                  <div className="admin-services-actions">
                    {selectedSubCategory ? (
                      <button
                        className="ghost-button h-9 px-3"
                        onClick={() => openEditSubCategory(selectedSubCategory)}
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={14} />
                        Sửa danh mục con
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
                        Xóa danh mục con
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
                    <button
                      aria-label="Đóng danh sách gói"
                      className="ghost-button h-9 px-3"
                      onClick={() => setShowPackages(false)}
                      type="button"
                    >
                      <X aria-hidden="true" size={14} />
                      Đóng
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
                    <strong>Mã nhà cung cấp</strong>
                    <span>{selectedSubCategory?.the9pServiceCode ?? "Chưa gắn"}</span>
                  </p>
                </div>

                <div className="admin-package-list">
                  <div className="admin-package-list-head" aria-hidden="true">
                    <span>Gói</span>
                    <span>Giá</span>
                    <span>Mệnh giá nhà cung cấp</span>
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
                        {item.originalPrice ? <small>{formatVnd(item.originalPrice)}</small> : null}
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
                          onClick={() => deleteEntity("package", item.id, item.name, item.subCategoryId)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={15} />
                          Xóa
                        </button>
                      </div>
                    </article>
                  ))}
                  {!isLoadingPackages && packages.length === 0 ? (
                    <div className="admin-services-empty">Chưa có gói dịch vụ trong mục này.</div>
                  ) : null}
                </div>
                    </section>
                  </div>,
                  document.body,
                )
              : null}
          </>
        )}
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
                {serviceTypeLabel(type)}
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
          Mã dịch vụ nhà cung cấp
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
  const selectedSubCategory = subCategories.find(
    (item) => item.id === form.subCategoryId,
  );
  const isAutomaticTopup = selectedSubCategory
    ? selectedSubCategory.type !== "GAME_SERVICE"
    : false;

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
          Mệnh giá nhà cung cấp
          <input
            className="text-field"
            disabled={isAutomaticTopup}
            inputMode="numeric"
            onChange={(event) =>
              onChange({ ...form, the9pAmount: normalizeIntegerInput(event.target.value) })
            }
            type="text"
            value={formatIntegerInput(form.the9pAmount)}
          />
          {isAutomaticTopup ? (
            <small>Mệnh giá này được cố định theo nhà cung cấp.</small>
          ) : null}
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

function AdminTablePagination({
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);
  const firstVisiblePage = Math.max(
    1,
    Math.min(safePage - 2, totalPages - 4),
  );
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <div className="admin-category-table-footer">
      <span>
        Hiển thị {firstItem}–{lastItem} trong tổng số {totalItems} kết quả
      </span>
      <nav aria-label="Phân trang danh mục" className="admin-table-pagination">
        <button
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
          type="button"
        >
          Trước
        </button>
        {visiblePages.map((page) => (
          <button
            aria-current={page === safePage ? "page" : undefined}
            className={page === safePage ? "active" : undefined}
            key={page}
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        ))}
        <button
          disabled={safePage === totalPages}
          onClick={() => onPageChange(safePage + 1)}
          type="button"
        >
          Sau
        </button>
      </nav>
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

function serviceTypeLabel(type: string) {
  return type === "TOPUP_THE9P" ? "TOPUP_CARD" : type;
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
    servicePackagePath(subCategoryId),
    { headers: authHeaders(session) },
  );
  const data = await readResponseJson(response);

  if (response.ok) {
    return data;
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
    return "Backend từ chối quyền 403. Hãy đăng nhập lại bằng tài khoản ADMIN.";
  }

  return getApiErrorMessage(data, fallback);
}

function serviceCategoryPath(categoryId = "") {
  const basePath = "/api/service-categories";
  return categoryId
    ? `${basePath}/${encodeURIComponent(categoryId)}`
    : basePath;
}

function serviceSubCategoryPath(parentId: string, subCategoryId = "") {
  const basePath = `${serviceCategoryPath(parentId)}/children`;
  return subCategoryId
    ? `${basePath}/${encodeURIComponent(subCategoryId)}`
    : basePath;
}

function servicePackagePath(subCategoryId: string, packageId = "") {
  const basePath = `/api/service-sub-categories/${encodeURIComponent(
    subCategoryId,
  )}/packages`;
  return packageId
    ? `${basePath}/${encodeURIComponent(packageId)}`
    : basePath;
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
