import { useState, useEffect, useCallback, useRef } from "react";
import {
  Package, Plus, X, Search, Sun, Moon, Eye, Trash2,
  CheckCircle2, Clock, DollarSign, BarChart3, RefreshCw, ShoppingBag,
  AlertTriangle, ChevronDown, FileText, LogOut, User,
} from "lucide-react";
import { fetchOrders, fetchOrder, createOrder, updateOrder, deleteOrder, getMe, logout } from "./api";
import LoginPage from "./LoginPage";

// ─── Toast System ───────────────────────────────────────────
let toastId = 0;

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg min-w-[300px] max-w-[420px] cursor-pointer
            ${t.type === "success" ? "border-l-4 border-l-emerald-500" : ""}
            ${t.type === "error" ? "border-l-4 border-l-red-500" : ""}
            ${t.type === "info" ? "border-l-4 border-l-blue-500" : ""}
            ${t.exiting ? "animate-toast-out" : "animate-toast-in"}`}
          onClick={() => onRemove(t.id)}
        >
          <div className={`flex-shrink-0 ${t.type === "success" ? "text-emerald-500" : t.type === "error" ? "text-red-500" : "text-blue-500"}`}>
            {t.type === "success" ? <CheckCircle2 size={20} /> : t.type === "error" ? <AlertTriangle size={20} /> : <FileText size={20} />}
          </div>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 300);
    }, 3000);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 300);
  }, []);
  return { toasts, addToast, removeToast };
}

// ─── Confirm Dialog ─────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 w-full max-w-sm shadow-2xl animate-fade-in-scale border border-gray-200 dark:border-gray-700 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="text-red-500" size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition shadow-lg shadow-red-500/25">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/[0.07] backdrop-blur-md border border-white/10 p-4 flex items-center gap-4 hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg ${gradient}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</div>
        <div className="text-xl font-bold text-white tracking-tight">{value}</div>
      </div>
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const isPending = status === "Pending";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
      ${isPending
        ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isPending ? "bg-amber-500" : "bg-emerald-500"}`} />
      {status}
    </span>
  );
}

// ─── Main App ───────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => { localStorage.removeItem("token"); })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      // token invalid
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard user={user} dark={dark} setDark={setDark} onLogout={handleLogout} />;
}

// ─── Dashboard ──────────────────────────────────────────────
function Dashboard({ user, dark, setDark, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await fetchOrders(filter || undefined));
    } catch (err) {
      if (err.message === "UNAUTHORIZED") { onLogout(); return; }
      setError("Failed to load orders. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [filter, onLogout]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Pending").length,
    completed: orders.filter((o) => o.status === "Completed").length,
    revenue: orders.reduce((s, o) => s + o.total_price, 0),
  };

  const filtered = orders
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.customer_name.toLowerCase().includes(q) || String(o.id).includes(q);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.id - a.id;
        case "oldest": return a.id - b.id;
        case "price-high": return b.total_price - a.total_price;
        case "price-low": return a.total_price - b.total_price;
        case "name": return a.customer_name.localeCompare(b.customer_name);
        default: return 0;
      }
    });

  const handleError = (err, msg) => {
    if (err.message === "UNAUTHORIZED") { onLogout(); return; }
    addToast(msg, "error");
  };

  const openDetail = async (id) => {
    try { setSelectedOrder(await fetchOrder(id)); }
    catch (err) { handleError(err, "Failed to load order details"); }
  };

  const toggleStatus = async (order) => {
    const next = order.status === "Pending" ? "Completed" : "Pending";
    try {
      const updated = await updateOrder(order.id, { status: next });
      setSelectedOrder(updated);
      loadOrders();
      addToast(`Order #${order.id} marked as ${next}`);
    } catch (err) { handleError(err, "Failed to update status"); }
  };

  const handleCreate = async (data) => {
    try {
      const o = await createOrder(data);
      setShowCreate(false);
      loadOrders();
      addToast(`Order #${o.id} created!`);
    } catch (err) { handleError(err, "Failed to create order"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOrder(id);
      setConfirmDelete(null);
      setSelectedOrder(null);
      loadOrders();
      addToast(`Order #${id} deleted`);
    } catch (err) { handleError(err, "Failed to delete order"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ─── Header ──────────────────────────────── */}
      <header className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-7 pb-8 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Package size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Order Manager</h1>
                <p className="text-xs text-white/40">Track and manage customer orders</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                {showCreate ? <X size={16} /> : <Plus size={16} />}
                {showCreate ? "Cancel" : "New Order"}
              </button>
              <button
                onClick={() => setDark(!dark)}
                className="w-10 h-10 rounded-xl border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white flex items-center justify-center transition backdrop-blur-sm"
                title="Toggle theme"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition backdrop-blur-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-white leading-tight">{user.full_name}</div>
                    <div className="text-[10px] text-white/40 leading-tight">{user.role}</div>
                  </div>
                  <ChevronDown size={14} className="text-white/40" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 animate-fade-in-scale overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center text-white text-sm font-bold">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.full_name}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                            ${user.role === "admin"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"}`}>
                            <User size={10} /> {user.role}
                          </span>
                        </div>
                      </div>
                      {/* Logout */}
                      <div className="p-1.5">
                        <button
                          onClick={() => { setShowUserMenu(false); onLogout(); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={BarChart3} label="Total Orders" value={stats.total} gradient="bg-gradient-to-br from-primary-500 to-primary-600" />
            <StatCard icon={Clock} label="Pending" value={stats.pending} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
            <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} gradient="bg-gradient-to-br from-emerald-500 to-teal-500" />
            <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} gradient="bg-gradient-to-br from-blue-500 to-cyan-500" />
          </div>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────── */}
      <main className="max-w-7xl w-full mx-auto px-5 py-6 flex-1">
        {showCreate && (
          <div className="animate-slide-down mb-5">
            <CreateOrderForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {[
              { v: "", l: "All", c: stats.total },
              { v: "Pending", l: "Pending", c: stats.pending },
              { v: "Completed", l: "Completed", c: stats.completed },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  ${filter === f.v
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/25"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                {f.l}
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                  ${filter === f.v ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-300"}`}>
                  {f.c}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 cursor-pointer transition"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price-high">Price: High → Low</option>
                <option value="price-low">Price: Low → High</option>
                <option value="name">Customer Name</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-5 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-none">
                <div className="w-10 h-10 rounded-full animate-shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 rounded-md animate-shimmer" />
                  <div className="h-3 w-24 rounded-md animate-shimmer" />
                </div>
                <div className="h-6 w-20 rounded-full animate-shimmer" />
                <div className="h-4 w-16 rounded-md animate-shimmer" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-up">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">{error}</h3>
              <p className="text-sm text-gray-400 mb-5">Make sure the backend server is running</p>
              <button onClick={loadOrders} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition shadow-lg shadow-primary-500/20">
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in-up">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4">
                {search ? <Search size={28} className="text-gray-300 dark:text-gray-500" /> : <ShoppingBag size={28} className="text-gray-300 dark:text-gray-500" />}
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">
                {search ? "No matching orders" : "No orders found"}
              </h3>
              <p className="text-sm text-gray-400">{search ? `No results for "${search}"` : "Create your first order to get started"}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/80">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">ID</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Customer</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden md:table-cell">Date</th>
                    <th className="px-5 py-3.5 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => openDetail(order.id)}
                      className="group cursor-pointer hover:bg-primary-50/50 dark:hover:bg-primary-500/5 transition-colors"
                    >
                      <td className="px-5 py-4"><span className="text-sm font-semibold text-primary-500">#{order.id}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {order.customer_name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{order.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-4"><span className="text-sm font-semibold text-gray-800 dark:text-gray-100 tabular-nums">${order.total_price.toFixed(2)}</span></td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); openDetail(order.id); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition" title="View"><Eye size={15} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(order.id); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" title="Delete"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 text-xs text-gray-400">
              Showing {filtered.length} of {orders.length} orders
            </div>
          </div>
        )}
      </main>

      {/* ─── Detail Modal ────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in-scale" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                Order <span className="text-sm font-semibold text-primary-500 bg-primary-50 dark:bg-primary-500/10 px-2.5 py-0.5 rounded-full">#{selectedOrder.id}</span>
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition"><X size={16} /></button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <DetailItem label="Customer" value={selectedOrder.customer_name} />
                <DetailItem label="Status" value={<StatusBadge status={selectedOrder.status} />} />
                <DetailItem label="Total" value={<span className="text-lg font-bold text-primary-500">${selectedOrder.total_price.toFixed(2)}</span>} />
                <DetailItem label="Created" value={new Date(selectedOrder.created_at).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })} />
              </div>
              {selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Order Items ({selectedOrder.items.length})</h3>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="grid grid-cols-[2fr_0.7fr_1fr_1fr] px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <span>Product</span><span>Qty</span><span>Price</span><span>Subtotal</span>
                    </div>
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-[2fr_0.7fr_1fr_1fr] px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-100">{item.product_name}</span>
                        <span className="text-gray-500">{item.quantity}</span>
                        <span className="text-gray-500">${item.price.toFixed(2)}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-2.5 justify-end">
              <button onClick={() => setConfirmDelete(selectedOrder.id)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition">
                <Trash2 size={15} /> Delete
              </button>
              <button
                onClick={() => toggleStatus(selectedOrder)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition shadow-lg hover:-translate-y-0.5 transition-all duration-200
                  ${selectedOrder.status === "Pending"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25 hover:shadow-amber-500/40"}`}
              >
                {selectedOrder.status === "Pending" ? <><CheckCircle2 size={15} /> Mark Completed</> : <><Clock size={15} /> Mark Pending</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`This will permanently delete order #${confirmDelete} and all its items. This cannot be undone.`}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────
function DetailItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
    </div>
  );
}

// ─── Create Order Form ──────────────────────────────────────
function CreateOrderForm({ onSubmit, onCancel }) {
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState([{ product_name: "", quantity: 1, price: "" }]);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const addItem = () => setItems([...items, { product_name: "", quantity: 1, price: "" }]);
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };
  const updateItem = (i, field, val) => setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const total = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    const valid = items.filter((i) => i.product_name.trim());
    if (!valid.length) return;
    onSubmit({
      customer_name: customerName.trim(),
      items: valid.map((i) => ({ product_name: i.product_name.trim(), quantity: Number(i.quantity) || 1, price: Number(i.price) || 0 })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-violet-500" />
      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
        <FileText size={18} className="text-primary-500" /> New Order
      </h2>
      <div className="mb-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Customer Name</label>
        <input ref={nameRef} type="text" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Order Items</h3>
        <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600 transition"><Plus size={14} /> Add item</button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_90px_32px] gap-2 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
            <input type="text" placeholder="Product name" value={item.product_name} onChange={(e) => updateItem(i, "product_name", e.target.value)} required
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition" />
            <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition" />
            <input type="number" min="0" step="0.01" placeholder="Price" value={item.price} onChange={(e) => updateItem(i, "price", e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition" />
            <button type="button" onClick={() => removeItem(i)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition self-center"><X size={15} /></button>
          </div>
        ))}
      </div>
      {total > 0 && <div className="text-right text-sm font-bold text-primary-500 mt-3">Estimated Total: ${total.toFixed(2)}</div>}
      <div className="flex gap-2.5 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200">
          <Package size={16} /> Create Order
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
      </div>
    </form>
  );
}
