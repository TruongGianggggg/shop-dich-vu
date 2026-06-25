"use client";

import {
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AdminUser,
  AuthResponse,
  formatVnd,
  getApiErrorMessage,
  PageResponse,
  UserRole,
} from "@/lib/shop-api";
import { AdminSidebar } from "@/app/components/admin/admin-sidebar";
import { useAuthSession } from "@/app/components/use-auth-session";

const pageSize = 20;
const roles: UserRole[] = ["USER", "COLLABORATOR", "ADMIN"];
const emptyForm = {
  username: "",
  email: "",
  password: "",
  role: "USER" as UserRole,
};

export function AdminUsersManager() {
  const session = useAuthSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pageInfo, setPageInfo] = useState<PageResponse<AdminUser> | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const canLoad = session?.role === "ADMIN";

  useEffect(() => {
    if (!canLoad || !session) {
      return;
    }

    const activeSession = session;
    let ignore = false;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          size: String(pageSize),
        });

        if (query) {
          params.set("keyword", query);
        }

        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          headers: authHeaders(activeSession),
        });
        const data = (await readResponseJson(response)) as
          | PageResponse<AdminUser>
          | unknown;

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, "Khong tai duoc danh sach nguoi dung."),
          );
        }

        if (!ignore) {
          const pageData = data as PageResponse<AdminUser>;
          setUsers(pageData.content);
          setPageInfo(pageData);
        }
      } catch (exception) {
        if (!ignore) {
          setUsers([]);
          setPageInfo(null);
          setError(
            exception instanceof Error
              ? exception.message
              : "Khong tai duoc danh sach nguoi dung.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      ignore = true;
    };
  }, [canLoad, page, query, refreshKey, session]);

  const totalLabel = useMemo(() => {
    if (!pageInfo) {
      return "0 nguoi dung";
    }

    return `${pageInfo.totalElements.toLocaleString("vi-VN")} nguoi dung`;
  }, [pageInfo]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPage(0);
    setQuery(searchValue.trim());
  }

  async function submitUserForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    };

    try {
      const response = await fetch(
        editingUserId ? `/api/admin/users/${editingUserId}` : "/api/admin/users",
        {
          method: editingUserId ? "PUT" : "POST",
          headers: {
            ...authHeaders(session),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = (await readResponseJson(response)) as AdminUser | null | unknown;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, "Khong luu duoc thong tin nguoi dung."),
        );
      }

      const savedUser = data as AdminUser | null;

      setUsers((current) => {
        if (!editingUserId || !savedUser) {
          return current;
        }

        return current.map((item) =>
          item.id === savedUser.id ? savedUser : item,
        );
      });
      setMessage(
        editingUserId
          ? `Da cap nhat ${savedUser?.username ?? form.username}.`
          : `Da tao ${savedUser?.username ?? form.username}.`,
      );
      closeForm();

      if (!editingUserId) {
        setPage(0);
      }

      setRefreshKey((current) => current + 1);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Khong luu duoc thong tin nguoi dung.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startCreate() {
    setEditingUserId("");
    setForm(emptyForm);
    setIsFormOpen(true);
    setMessage("");
    setError("");
  }

  function startEdit(user: AdminUser) {
    setEditingUserId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsFormOpen(true);
    setMessage("");
    setError("");
  }

  function closeForm() {
    setEditingUserId("");
    setForm(emptyForm);
    setIsFormOpen(false);
  }

  async function updateRole(user: AdminUser, role: UserRole) {
    if (!session || role === user.role) {
      return;
    }

    setUpdatingUserId(user.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PUT",
        headers: {
          ...authHeaders(session),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });
      const data = (await readResponseJson(response)) as
        | Partial<AdminUser>
        | null
        | unknown;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, "Khong cap nhat duoc role nguoi dung."),
        );
      }

      const updatedUser = (data ?? {}) as Partial<AdminUser>;

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                role: updatedUser.role ?? role,
                collaboratorBalance:
                  updatedUser.collaboratorBalance ?? item.collaboratorBalance,
                collaboratorTotalEarned:
                  updatedUser.collaboratorTotalEarned ??
                  item.collaboratorTotalEarned,
              }
            : item,
        ),
      );
      setMessage(`Da cap nhat role cho ${user.username}.`);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Khong cap nhat duoc role nguoi dung.",
      );
    } finally {
      setUpdatingUserId("");
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!session) {
      return;
    }

    const confirmed = window.confirm(`Xoa tai khoan ${user.username}?`);

    if (!confirmed) {
      return;
    }

    setUpdatingUserId(user.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: authHeaders(session),
      });

      if (!response.ok) {
        const data = await readResponseJson(response);
        throw new Error(
          getApiErrorMessage(data, "Khong xoa duoc nguoi dung."),
        );
      }

      setUsers((current) => current.filter((item) => item.id !== user.id));
      setMessage(`Da xoa ${user.username}.`);

      if (editingUserId === user.id) {
        closeForm();
      }

      setRefreshKey((current) => current + 1);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Khong xoa duoc nguoi dung.",
      );
    } finally {
      setUpdatingUserId("");
    }
  }

  return (
    <main className="role-dashboard">
      <AdminSidebar active="users" />

      <section className="role-main backoffice-users-main">
        <header className="role-topbar backoffice-users-header">
          <div>
            <h1>Quản lý Users</h1>
          </div>
          <div className="role-topbar-actions">
            <button
              className="ghost-button h-11 px-5"
              disabled={isLoading}
              onClick={() => setRefreshKey((current) => current + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Tải lại
            </button>
            <button
              className="primary-button h-11 px-5"
              data-testid="open-user-form"
              onClick={startCreate}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              Thêm mới
            </button>
          </div>
        </header>

        <section className="role-panel admin-users-toolbar">
          <form onSubmit={submitSearch}>
            <label className="field-label admin-users-search">
              <span>
                <Search aria-hidden="true" size={16} />
                <input
                  className="text-field"
                  name="keyword"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Tìm username hoặc email..."
                  value={searchValue}
                />
              </span>
            </label>
            <button className="primary-button h-11 px-5" disabled={isLoading}>
              <Search aria-hidden="true" size={16} />
              Tìm
            </button>
          </form>
          <div className="admin-users-summary">
            <strong>{totalLabel}</strong>
            <span>Trang {(pageInfo?.page ?? page) + 1}</span>
          </div>
        </section>

        {message ? <p className="admin-users-message success">{message}</p> : null}
        {error ? <p className="admin-users-message error">{error}</p> : null}

        <section className="role-panel role-table-panel backoffice-table-card">
          <div className="role-panel-head">
            <div>
              <h2>Tài khoản hệ thống</h2>
            </div>
            <span>{isLoading ? "Dang tai" : totalLabel}</span>
          </div>

          <div className="role-table-wrap">
            <table className="role-table admin-users-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>So du</th>
                  <th>CTV</th>
                  <th>Ngay tao</th>
                  <th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{user.username}</strong>
                      <small>{user.id}</small>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        aria-label={`Role cua ${user.username}`}
                        className="role-select"
                        disabled={updatingUserId === user.id}
                        onChange={(event) =>
                          updateRole(user, event.target.value as UserRole)
                        }
                        value={user.role}
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{formatVnd(user.balance)}</td>
                    <td>
                      <span>{formatVnd(user.collaboratorBalance)}</span>
                      <small>{formatVnd(user.collaboratorTotalEarned)}</small>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="admin-users-actions">
                        <button
                          className="ghost-button h-9 px-3"
                          onClick={() => startEdit(user)}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={15} />
                          Sửa
                        </button>
                        <button
                          className="danger-button h-9 px-3"
                          disabled={updatingUserId === user.id}
                          onClick={() => deleteUser(user)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={15} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && users.length === 0 ? (
                  <tr>
                    <td colSpan={8}>Khong co nguoi dung phu hop.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="admin-users-pagination">
            <button
              className="ghost-button h-10 px-4"
              disabled={isLoading || pageInfo?.first !== false}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              type="button"
            >
              Truoc
            </button>
            <button
              className="ghost-button h-10 px-4"
              disabled={isLoading || pageInfo?.last !== false}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              Sau
            </button>
          </div>
        </section>
      </section>

      {isFormOpen && typeof document !== "undefined" ? createPortal(
        <div className="admin-user-modal" role="presentation">
          <button
            aria-label="Dong form nguoi dung"
            className="admin-user-modal-backdrop"
            onClick={closeForm}
            type="button"
          />
          <section
            aria-modal="true"
            className="admin-user-modal-panel"
            role="dialog"
          >
            <div className="admin-user-modal-header">
              <div>
                <h2>{editingUserId ? "Sửa người dùng" : "Tạo user"}</h2>
                <p>Nhập thông tin người dùng</p>
              </div>
              <button
                aria-label="Dong form"
                className="admin-user-modal-close"
                onClick={closeForm}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <form className="admin-user-form" onSubmit={submitUserForm}>
              <div className="admin-user-form-content">
                <label className="field-label">
                  Username
                  <input
                    className="text-field"
                    maxLength={32}
                    minLength={3}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    required
                    value={form.username}
                  />
                </label>
                <label className="field-label">
                  Email
                  <input
                    className="text-field"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                    type="email"
                    value={form.email}
                  />
                </label>
                <label className="field-label">
                  Mat khau
                  <input
                    className="text-field"
                    maxLength={72}
                    minLength={6}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder={editingUserId ? "De trong neu khong doi" : ""}
                    required={!editingUserId}
                    type="password"
                    value={form.password}
                  />
                </label>
                <label className="field-label">
                  Role
                  <select
                    className="role-select wide"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        role: event.target.value as UserRole,
                      }))
                    }
                    value={form.role}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="admin-user-modal-actions">
                <button
                  className="ghost-button h-11 px-5"
                  onClick={closeForm}
                  type="button"
                >
                  Huy
                </button>
                <button
                  className="primary-button h-11 px-5"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Dang luu..." : editingUserId ? "Luu" : "Them"}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      ) : null}
    </main>
  );
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

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
