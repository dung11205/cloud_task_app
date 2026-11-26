
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import TaskCharts from "./TaskCharts";
import "./App.css";

// ==========================================
// CẤU HÌNH TRẠNG THÁI
// ==========================================

const STATUSES = [
  { key: "todo", label: "Chưa làm", icon: "○" },
  { key: "in_progress", label: "Đang làm", icon: "◷" },
  { key: "done", label: "Hoàn thành", icon: "✓" },
];

const PRIORITIES = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

const emptyForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
};

// ==========================================
// CÁC HÀM HỖ TRỢ
// ==========================================

const getStatus = (task) =>
  task.status ?? (task.completed ? "done" : "todo");

const displayDate = (date) =>
  date ? date.split("-").reverse().join("/") : "Không có hạn";

const todayLocal = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ==========================================
// COMPONENT HIỂN THỊ CÔNG VIỆC
// ==========================================

function TaskCard({ task, busy, onEdit, onDelete, onStatus }) {
  const status = getStatus(task);
  const priority = task.priority ?? "medium";

  const overdue =
    task.dueDate &&
    task.dueDate < todayLocal() &&
    status !== "done";

  return (
    <article className={`task-card ${status}`}>
      <div className="task-card-top">
        <span className={`priority priority-${priority}`}>
          ● {PRIORITIES[priority]}
        </span>

        <div className="card-actions">
          <button
            type="button"
            title="Chỉnh sửa"
            onClick={() => onEdit(task)}
          >
            ✎
          </button>

          <button
            type="button"
            title="Xóa"
            disabled={busy}
            onClick={() => onDelete(task)}
          >
            ×
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>

      {task.description && (
        <p className="task-description">
          {task.description}
        </p>
      )}

      <div className="task-card-bottom">
        <span className={overdue ? "overdue" : "due-date"}>
          ◷ {displayDate(task.dueDate)}
          {overdue ? " · Quá hạn" : ""}
        </span>

        <select
          value={status}
          disabled={busy}
          onChange={(e) =>
            onStatus(task._id, e.target.value)
          }
          aria-label={`Trạng thái ${task.title}`}
        >
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

// ==========================================
// COMPONENT CHÍNH
// ==========================================

export default function App() {
  // Kết nối Convex
  const tasks = useQuery(api.tasks.getTasks);
  const addTask = useMutation(api.tasks.addTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  // Quản lý trạng thái
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("board");

  // Trạng thái chuyển trang
  const [page, setPage] = useState("all");

  // Chế độ sáng/tối
  const [dark, setDark] = useState(
    () => localStorage.getItem("cloud-task-theme") === "dark"
  );

  useEffect(() => {
    localStorage.setItem(
      "cloud-task-theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  // ==========================================
  // TIÊU ĐỀ TRANG
  // ==========================================

  const pageTitle =
    page === "all"
      ? "Bảng điều khiển"
      : STATUSES.find((s) => s.key === page)?.label ??
        "Quản lý công việc";

  const pageDescriptions = {
    all: "Sắp xếp và theo dõi mọi công việc tại một nơi",
    todo: "Quản lý những công việc chưa bắt đầu thực hiện",
    in_progress: "Theo dõi những công việc đang thực hiện",
    done: "Xem lại những công việc đã hoàn thành",
  };

  // ==========================================
  // CHỨC NĂNG CHUYỂN TRANG
  // ==========================================

  function navigatePage(nextPage) {
    setPage(nextPage);
    setFilter(nextPage);
    setSearch("");

    setView(nextPage === "all" ? "board" : "list");

    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // THỐNG KÊ CÔNG VIỆC
  // ==========================================

  const allTasks = useMemo(() => tasks ?? [], [tasks]);

  const counts = useMemo(
    () => ({
      all: allTasks.length,

      todo: allTasks.filter(
        (t) => getStatus(t) === "todo"
      ).length,

      in_progress: allTasks.filter(
        (t) => getStatus(t) === "in_progress"
      ).length,

      done: allTasks.filter(
        (t) => getStatus(t) === "done"
      ).length,
    }),
    [allTasks]
  );

  // Tính phần trăm hoàn thành
  const percent = counts.all
    ? Math.round((counts.done / counts.all) * 100)
    : 0;

  // ==========================================
  // TÌM KIẾM VÀ LỌC CÔNG VIỆC
  // ==========================================

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");

    const activeFilter =
      page === "all" ? filter : page;

    return allTasks.filter((t) => {
      const matchesSearch =
        `${t.title} ${t.description ?? ""}`
          .toLocaleLowerCase("vi")
          .includes(term);

      const matchesStatus =
        activeFilter === "all" ||
        getStatus(t) === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allTasks, search, filter, page]);

  // ==========================================
  // TẠO CÔNG VIỆC MỚI
  // ==========================================

  function createNew() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      status: page === "all" ? "todo" : page,
    });

    setError("");
    setFormOpen(true);
  }

  // ==========================================
  // CHỈNH SỬA CÔNG VIỆC
  // ==========================================

  function editTask(task) {
    setEditingId(task._id);

    setForm({
      title: task.title,
      description: task.description ?? "",
      status: getStatus(task),
      priority: task.priority ?? "medium",
      dueDate: task.dueDate ?? "",
    });

    setError("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Đóng form
  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  // Cập nhật dữ liệu form
  function field(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ==========================================
  // LƯU CÔNG VIỆC VÀO CONVEX
  // ==========================================

  async function submit(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Vui lòng nhập tên công việc.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
      };

      if (editingId) {
        await updateTask({
          id: editingId,
          ...payload,
        });
      } else {
        await addTask(payload);
      }

      closeForm();
    } catch (err) {
      setError(
        err.message || "Không lưu được công việc."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // CẬP NHẬT TRẠNG THÁI
  // ==========================================

  async function changeStatus(id, status) {
    setBusyId(id);
    setError("");

    try {
      await updateTask({ id, status });
    } catch (err) {
      setError(
        err.message || "Không đổi được trạng thái."
      );
    } finally {
      setBusyId(null);
    }
  }

  // ==========================================
  // XÓA CÔNG VIỆC
  // ==========================================

  async function remove(task) {
    if (
      !window.confirm(
        `Xóa công việc "${task.title}"?`
      )
    ) {
      return;
    }

    setBusyId(task._id);
    setError("");

    try {
      await deleteTask({ id: task._id });
    } catch (err) {
      setError(
        err.message || "Không xóa được công việc."
      );
    } finally {
      setBusyId(null);
    }
  }

  // ==========================================
  // RENDER TASK CARD
  // ==========================================

  const renderTask = (task) => (
    <TaskCard
      key={task._id}
      task={task}
      busy={busyId === task._id}
      onEdit={editTask}
      onDelete={remove}
      onStatus={changeStatus}
    />
  );

  // ==========================================
  // GIAO DIỆN CHÍNH
  // ==========================================

  return (
    <div className={`app ${dark ? "dark" : ""}`}>

      {/* ====================================
          SIDEBAR
      ==================================== */}

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">☁</span>

          <div>
            <strong>
              Cloud Task <em>Pro</em>
            </strong>

            <small>PERSONAL WORKSPACE</small>
          </div>
        </div>

        <div className="sidebar-label">
          KHÔNG GIAN LÀM VIỆC
        </div>

        <nav className="sidebar-nav">

          {/* Trang tổng quan */}

          <button
            type="button"
            className={
              page === "all" ? "selected" : ""
            }
            onClick={() => navigatePage("all")}
          >
            ▦ <span>Tổng quan</span>
            <b>{counts.all}</b>
          </button>

          {/* Các trang trạng thái */}

          {STATUSES.map((s) => (
            <button
              type="button"
              key={s.key}
              className={
                page === s.key ? "selected" : ""
              }
              onClick={() => navigatePage(s.key)}
            >
              {s.icon}

              <span>{s.label}</span>

              <b>{counts[s.key]}</b>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />

          Convex Cloud

          <small>
            Dữ liệu đồng bộ trực tuyến
          </small>
        </div>
      </aside>

      {/* ====================================
          MAIN CONTENT
      ==================================== */}

      <main className="main">

        {/* TOPBAR */}

        <header className="topbar">
          <div>
            <span className="muted">
              Không gian làm việc
            </span>

            <span className="slash">/</span>

            <strong>{pageTitle}</strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              title="Đổi sáng/tối"
              onClick={() => setDark((v) => !v)}
            >
              {dark ? "☀" : "☾"}
            </button>

            <span className="avatar">CT</span>
          </div>
        </header>

        <div className="content">

          {/* ==================================
              TRANG TỔNG QUAN
          ================================== */}

          {page === "all" && (
            <>
              {/* BANNER */}

              <section className="hero">
                <div>
                  <span className="eyebrow">
                    ✦ KHÔNG GIAN LÀM VIỆC HIỆU QUẢ CỦA BẠN
                  </span>

                  <h1>
                    Chào mừng trở lại 👋
                  </h1>

                  <p>
                    Quản lý công việc thông minh,
                    theo dõi tiến độ và hoàn thành
                    mục tiêu của bạn.
                  </p>

                  <button
                    type="button"
                    className="hero-button"
                    onClick={createNew}
                  >
                    ＋ Tạo công việc mới
                  </button>
                </div>

                <div className="hero-art">
                  <span>✓</span>

                  <small>
                    PLAN · FOCUS · ACHIEVE
                  </small>
                </div>
              </section>

              {/* ==================================
                  THỐNG KÊ
              ================================== */}

              <section className="stats">
                {[
                  {
                    key: "all",
                    label: "Tổng công việc",
                    icon: "▦",
                    color: "blue",
                  },
                  {
                    key: "todo",
                    label: "Chưa làm",
                    icon: "○",
                    color: "orange",
                  },
                  {
                    key: "in_progress",
                    label: "Đang làm",
                    icon: "◷",
                    color: "violet",
                  },
                  {
                    key: "done",
                    label: "Hoàn thành",
                    icon: "✓",
                    color: "green",
                  },
                ].map((s) => (
                  <div
                    className="stat"
                    key={s.key}
                  >
                    <span
                      className={`stat-icon ${s.color}`}
                    >
                      {s.icon}
                    </span>

                    <span className="stat-label">
                      {s.label}
                    </span>

                    <strong>
                      {tasks === undefined
                        ? "…"
                        : counts[s.key]}
                    </strong>

                    <small>
                      {s.key === "done"
                        ? "Đã hoàn tất"
                        : s.key === "all"
                        ? "Tất cả công việc"
                        : "Công việc hiện tại"}
                    </small>
                  </div>
                ))}
              </section>

              {/* ==================================
                  TIẾN ĐỘ HOÀN THÀNH
              ================================== */}

              <section className="progress">
                <div className="progress-heading">
                  <div>
                    <h2>
                      Tiến độ hoàn thành
                    </h2>

                    <p>
                      Bạn đã hoàn thành{" "}
                      {counts.done} trên{" "}
                      {counts.all} công việc
                    </p>
                  </div>

                  <strong>{percent}%</strong>
                </div>

                <div className="progress-track">
                  <div
                    style={{
                      width: `${percent}%`,
                    }}
                  />
                </div>
              </section>

              {/* ==================================
                  BIỂU ĐỒ THỐNG KÊ CÔNG VIỆC
                  CHỨC NĂNG MỚI
              ================================== */}

              {tasks !== undefined && (
                <TaskCharts
                  counts={counts}
                  dark={dark}
                />
              )}

            </>
          )}

          {/* ==================================
              BANNER CÁC TRANG RIÊNG
          ================================== */}

          {page !== "all" && (
            <section className="hero">
              <div>
                <span className="eyebrow">
                  ✦ QUẢN LÝ CÔNG VIỆC
                </span>

                <h1>
                  {STATUSES.find(
                    (s) => s.key === page
                  )?.icon}{" "}
                  {pageTitle}
                </h1>

                <p>
                  {pageDescriptions[page]}
                </p>

                <button
                  type="button"
                  className="hero-button"
                  onClick={createNew}
                >
                  ＋ Tạo công việc mới
                </button>
              </div>

              <div className="hero-art">
                <span>{counts[page]}</span>

                <small>
                  CÔNG VIỆC {pageTitle.toUpperCase()}
                </small>
              </div>
            </section>
          )}

          {/* ==================================
              HIỂN THỊ LỖI
          ================================== */}

          {error && (
            <div className="error" role="alert">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {/* ==================================
              FORM THÊM / SỬA CÔNG VIỆC
          ================================== */}

          {formOpen && (
            <section className="panel form-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    {editingId
                      ? "Chỉnh sửa công việc"
                      : "Tạo công việc mới"}
                  </h2>

                  <p>
                    Điền thông tin và lưu vào Convex Cloud
                  </p>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={closeForm}
                >
                  ×
                </button>
              </div>

              <form onSubmit={submit}>

                {/* Tên công việc */}

                <label>
                  Tên công việc *

                  <input
                    required
                    maxLength={150}
                    autoFocus
                    placeholder="Ví dụ: Hoàn thành bài tập Cloud"
                    value={form.title}
                    onChange={(e) =>
                      field("title", e.target.value)
                    }
                  />
                </label>

                {/* Mô tả */}

                <label>
                  Mô tả

                  <textarea
                    rows={3}
                    placeholder="Ghi chú chi tiết..."
                    value={form.description}
                    onChange={(e) =>
                      field(
                        "description",
                        e.target.value
                      )
                    }
                  />
                </label>

                <div className="form-grid">

                  {/* Trạng thái */}

                  <label>
                    Trạng thái

                    <select
                      value={form.status}
                      onChange={(e) =>
                        field(
                          "status",
                          e.target.value
                        )
                      }
                    >
                      {STATUSES.map((s) => (
                        <option
                          key={s.key}
                          value={s.key}
                        >
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Ưu tiên */}

                  <label>
                    Ưu tiên

                    <select
                      value={form.priority}
                      onChange={(e) =>
                        field(
                          "priority",
                          e.target.value
                        )
                      }
                    >
                      <option value="low">
                        Thấp
                      </option>

                      <option value="medium">
                        Trung bình
                      </option>

                      <option value="high">
                        Cao
                      </option>
                    </select>
                  </label>

                  {/* Hạn hoàn thành */}

                  <label>
                    Hạn hoàn thành

                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) =>
                        field(
                          "dueDate",
                          e.target.value
                        )
                      }
                    />
                  </label>
                </div>

                {/* Nút chức năng */}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeForm}
                  >
                    Hủy
                  </button>

                  <button
                    className="primary-button"
                    disabled={saving}
                    type="submit"
                  >
                    {saving
                      ? "Đang lưu..."
                      : editingId
                      ? "Lưu thay đổi"
                      : "＋ Thêm công việc"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ==================================
              DANH SÁCH CÔNG VIỆC
          ================================== */}

          <section className="panel work-panel">
            <div className="panel-header">
              <div>
                <h2>
                  {page === "all"
                    ? "Quản lý công việc"
                    : `Công việc ${pageTitle.toLowerCase()}`}
                </h2>

                <p>
                  {page === "all"
                    ? pageDescriptions.all
                    : `Bạn có ${counts[page]} công việc ${pageTitle.toLowerCase()}`}
                </p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={createNew}
              >
                ＋ Thêm mới
              </button>
            </div>

            {/* ==================================
                THANH CÔNG CỤ
            ================================== */}

            <div className="toolbar">

              {/* Tìm kiếm */}

              <input
                type="search"
                placeholder="⌕ Tìm kiếm công việc..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              {/* Bộ lọc trạng thái */}

              <select
                value={
                  page === "all" ? filter : page
                }
                disabled={page !== "all"}
                onChange={(e) =>
                  setFilter(e.target.value)
                }
              >
                <option value="all">
                  Tất cả trạng thái
                </option>

                {STATUSES.map((s) => (
                  <option
                    key={s.key}
                    value={s.key}
                  >
                    {s.label}
                  </option>
                ))}
              </select>

              {/* Chuyển kiểu hiển thị */}

              <div className="view-switch">
                <button
                  type="button"
                  className={
                    view === "board" ? "active" : ""
                  }
                  onClick={() => setView("board")}
                >
                  {page === "all"
                    ? "▦ 3 cột"
                    : "▦ Thẻ"}
                </button>

                <button
                  type="button"
                  className={
                    view === "list" ? "active" : ""
                  }
                  onClick={() => setView("list")}
                >
                  ☷ Danh sách
                </button>
              </div>
            </div>

            {/* ==================================
                HIỂN THỊ DỮ LIỆU
            ================================== */}

            {tasks === undefined ? (
              <div className="empty">
                Đang tải dữ liệu từ Convex...
              </div>
            ) : visible.length === 0 ? (
              <div className="empty">
                <span>☑</span>

                <h3>
                  {search.trim()
                    ? "Không tìm thấy công việc"
                    : page === "all"
                    ? "Chưa có công việc phù hợp"
                    : `Chưa có công việc ${pageTitle.toLowerCase()}`}
                </h3>

                <p>
                  {search.trim()
                    ? "Hãy thử tìm kiếm bằng từ khóa khác."
                    : "Thêm công việc mới hoặc thay đổi bộ lọc."}
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={createNew}
                >
                  ＋ Tạo công việc
                </button>
              </div>

            ) : view === "board" ? (

              /* ==================================
                  GIAO DIỆN KANBAN
              ================================== */

              <div
                className="kanban"
                style={
                  page !== "all"
                    ? {
                        gridTemplateColumns:
                          "minmax(0, 1fr)",
                      }
                    : undefined
                }
              >
                {STATUSES.filter(
                  (s) =>
                    page === "all" ||
                    s.key === page
                ).map((s) => {
                  const group = visible.filter(
                    (t) => getStatus(t) === s.key
                  );

                  return (
                    <section
                      className={`kanban-column ${s.key}`}
                      key={s.key}
                    >
                      <div className="column-heading">
                        <h3>
                          <span>{s.icon}</span>{" "}
                          {s.label}
                        </h3>

                        <b>{group.length}</b>
                      </div>

                      <div className="column-body">
                        {group.length ? (
                          group.map(renderTask)
                        ) : (
                          <p className="column-empty">
                            Chưa có công việc
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (

              /* ==================================
                  GIAO DIỆN DANH SÁCH
              ================================== */

              <div className="list-view">
                {visible.map(renderTask)}
              </div>
            )}
          </section>

          {/* ==================================
              FOOTER
          ================================== */}

          <footer>
            Cloud Task Pro © 2026 · React + Convex Cloud
          </footer>
        </div>
      </main>
    </div>
  );
}
