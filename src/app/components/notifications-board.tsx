"use client";

import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Hammer,
  MapPin,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  Sparkles,
  Swords,
  UserRound,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  GameNotification,
  GameNotificationFilters,
  getApiErrorMessage,
  PageResponse,
} from "@/lib/shop-api";

type Query = {
  page: number;
  serverNames: string[];
  eventTypes: string[];
  search: string;
};

const EMPTY_PAGE: PageResponse<GameNotification> = {
  content: [],
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
};

export function NotificationsBoard({
  initialPage,
  initialFilters,
}: {
  initialPage: PageResponse<GameNotification>;
  initialFilters: GameNotificationFilters;
}) {
  const [data, setData] = useState(initialPage);
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState<Query>({
    page: 0,
    serverNames: [],
    eventTypes: [],
    search: "",
  });
  const [searchDraft, setSearchDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const skippedInitialRequest = useRef(false);

  const loadNotifications = useCallback(async (nextQuery: Query, quiet = false) => {
    if (!quiet) setLoading(true);
    const params = new URLSearchParams({
      page: String(nextQuery.page),
      size: "20",
    });
    nextQuery.serverNames.forEach((serverName) => params.append("serverName", serverName));
    nextQuery.eventTypes.forEach((eventType) => params.append("eventType", eventType));
    if (nextQuery.search) params.set("search", nextQuery.search);

    try {
      const response = await fetch(`/api/notifications?${params}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, "Không tải được thông báo."));
      }
      setData(payload as PageResponse<GameNotification>);
      setError("");
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không tải được thông báo.",
      );
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!skippedInitialRequest.current) {
      skippedInitialRequest.current = true;
      setLastUpdated(new Date());
      return;
    }
    void loadNotifications(query);
  }, [loadNotifications, query]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadNotifications(query, true);
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications, query]);

  useEffect(() => {
    if (initialFilters.serverNames.length || initialFilters.eventTypes.length) return;
    void fetch("/api/notifications/filters", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as GameNotificationFilters;
      })
      .then((payload) => {
        if (payload) setFilters(payload);
      })
      .catch(() => undefined);
  }, [initialFilters]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery((current) => ({
      ...current,
      page: 0,
      search: searchDraft.trim(),
    }));
  }

  return (
    <section className="notifications-panel" aria-busy={loading}>
      <div className="notifications-toolbar">
        <MultiSelect
          allLabel="Tất cả vũ trụ"
          label="Vũ trụ"
          options={filters.serverNames.map((serverName) => ({
            label: serverName,
            value: serverName,
          }))}
          selected={query.serverNames}
          onChange={(serverNames) =>
            setQuery((current) => ({ ...current, page: 0, serverNames }))
          }
        />

        <MultiSelect
          allLabel="Tất cả sự kiện"
          label="Sự kiện"
          options={filters.eventTypes.map((eventType) => ({
            label: eventLabel(eventType),
            value: eventType,
          }))}
          selected={query.eventTypes}
          onChange={(eventTypes) =>
            setQuery((current) => ({ ...current, page: 0, eventTypes }))
          }
        />

        <form className="notification-search" onSubmit={submitSearch}>
          <label htmlFor="notification-search">Tìm kiếm</label>
          <div>
            <Search aria-hidden="true" size={17} />
            <input
              id="notification-search"
              placeholder="Boss, nhân vật, nội dung..."
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
            <button type="submit">Tìm</button>
          </div>
        </form>
      </div>

      <div className="notifications-statusbar">
        <p>
          <span className="live-dot" />
          Tự cập nhật mỗi 10 giây
          {lastUpdated ? ` · Cập nhật ${formatTime(lastUpdated)}` : ""}
        </p>
        <button
          disabled={loading}
          onClick={() => void loadNotifications(query)}
          type="button"
        >
          <RefreshCw className={loading ? "is-spinning" : ""} size={15} />
          Làm mới
        </button>
      </div>

      {error ? (
        <div className="notifications-error" role="alert">
          <CircleAlert size={18} /> {error}
        </div>
      ) : null}

      {data.content.length ? (
        <div className="notification-list">
          {data.content.map((notification) => (
            <NotificationItem notification={notification} key={notification.id} />
          ))}
        </div>
      ) : (
        <div className="notifications-empty">
          <Bell size={34} />
          <h2>Chưa có thông báo phù hợp</h2>
          <p>Dữ liệu mới sẽ tự động xuất hiện tại đây.</p>
        </div>
      )}

      <div className="notifications-pagination">
        <p>
          {data.totalElements
            ? `Hiển thị ${data.page * data.size + 1}–${Math.min((data.page + 1) * data.size, data.totalElements)} trong ${data.totalElements} thông báo`
            : "0 thông báo"}
        </p>
        <div>
          <button
            aria-label="Trang trước"
            disabled={data.first || loading}
            onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
            type="button"
          >
            <ChevronLeft size={17} />
          </button>
          <span>Trang {data.totalPages ? data.page + 1 : 0}/{data.totalPages}</span>
          <button
            aria-label="Trang sau"
            disabled={data.last || loading}
            onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
            type="button"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}

function MultiSelect({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label);
  const summary = selectedLabels.length === 0
    ? allLabel
    : selectedLabels.length === 1
      ? selectedLabels[0]
      : `Đã chọn ${selectedLabels.length}`;

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((selectedValue) => selectedValue !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="notification-multiselect">
      <span>{label}</span>
      <details>
        <summary>
          <span>{summary}</span>
          {selected.length ? <b>{selected.length}</b> : null}
        </summary>
        <div className="notification-multiselect-menu">
          <div className="notification-multiselect-actions">
            <strong>{label}</strong>
            <button
              disabled={!selected.length}
              onClick={() => onChange([])}
              type="button"
            >
              Bỏ chọn
            </button>
          </div>
          <div className="notification-multiselect-options">
            {options.length ? options.map((option) => (
              <label key={option.value}>
                <input
                  checked={selected.includes(option.value)}
                  onChange={() => toggle(option.value)}
                  type="checkbox"
                />
                <span>{option.label}</span>
              </label>
            )) : <p>Chưa có dữ liệu</p>}
          </div>
        </div>
      </details>
    </div>
  );
}

function NotificationItem({ notification }: { notification: GameNotification }) {
  const presentation = eventPresentation(notification);
  const Icon = presentation.icon;

  return (
    <article className={`notification-item ${presentation.tone}`}>
      <div className="notification-icon"><Icon size={21} /></div>
      <div className="notification-content">
        <div className="notification-heading">
          <div>
            <span>{presentation.label}</span>
            <strong>{notification.message || "Thông báo sự kiện trong game"}</strong>
          </div>
          <time dateTime={notification.timestamp}>
            <Clock3 size={14} /> {formatDate(notification.timestamp)}
          </time>
        </div>
        <div className="notification-meta">
          {notification.serverName ? <span><Server size={14} />{notification.serverName}</span> : null}
          {notification.characterName ? <span><UserRound size={14} />{notification.characterName}</span> : null}
          {notification.bossName ? <span><Swords size={14} />{notification.bossName}</span> : null}
          {notification.location ? <span><MapPin size={14} />{notification.location}</span> : null}
        </div>
      </div>
    </article>
  );
}

function eventPresentation(notification: GameNotification) {
  if (notification.eventType === "ThongBaoBaoTri") {
    return { label: "Thông báo bảo trì", tone: "maintenance", icon: ShieldAlert };
  }
  if (notification.eventType === "BossDefeated") {
    return { label: "Boss đã bị hạ", tone: "defeated", icon: Swords };
  }
  if (["PhaLeHoa", "NangCapTrangBi", "CheTaoDoThienSu"].includes(notification.eventType)) {
    return { label: eventLabel(notification.eventType), tone: "upgrade", icon: Hammer };
  }
  if (["NhatDoSKH", "NhatDoThanLinh", "ItemVinhVien"].includes(notification.eventType)) {
    return { label: eventLabel(notification.eventType), tone: "loot", icon: Sparkles };
  }
  if (notification.bossName || notification.location) {
    return { label: "Boss xuất hiện", tone: "boss", icon: Bell };
  }
  return { label: eventLabel(notification.eventType), tone: "general", icon: Bell };
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    ThongBaoBaoTri: "Thông báo bảo trì",
    NhatDoSKH: "Nhặt đồ kích hoạt",
    NhatDoThanLinh: "Nhặt đồ thần linh",
    PhaLeHoa: "Pha lê hóa",
    NangCapTrangBi: "Nâng cấp trang bị",
    CheTaoDoThienSu: "Chế tạo đồ thiên sứ",
    ItemVinhVien: "Nhận vật phẩm vĩnh viễn",
    BossSpawn: "Boss xuất hiện",
    BossDefeated: "Boss đã bị hạ",
  };
  return labels[eventType] ?? eventType ?? "Sự kiện game";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không rõ thời gian";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

export { EMPTY_PAGE };
