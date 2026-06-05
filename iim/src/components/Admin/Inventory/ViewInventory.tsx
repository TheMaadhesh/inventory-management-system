import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb } from "../../Admin/Navbar";
import { useNavigate } from "react-router-dom";

interface Item {
  itemId: number;
  name: string;
  itemCode: string;
  description: string;
  quantityInStock: number;
  unitPrice: number;
  reOrderLevel: number;
  qrPath: string | null;
  categoryDescription: string;
  supplierName: string;
}

const ITEMS_PER_PAGE = 10;

// ── QR URL resolver ───────────────────────────────────────────────
// Always returns a RELATIVE path so Vite proxies it to localhost:8080.
// This avoids CORS / access-denied errors in the browser.
//
// Backend may store qrPath as:
//   "/QrImages/Name_Code_1.png"  → strip origin → "/QrImages/Name_Code_1.png"
//   "/QrImages/Name_Code_1.png"                       → already relative, use as-is
//   "qr/items/mob001.png"                             → prepend slash → "/qr/items/mob001.png"
//   null / ""                                         → null (no QR generated)

const resolveQrUrl = (qrPath: string | null): string | null => {
  if (!qrPath) return null;
  // If qrPath already has http, use it
  if (/^https?:\/\//.test(qrPath)) return qrPath;
  // Otherwise, prepend backend origin
  return `http://localhost:8080${qrPath.startsWith("/") ? qrPath : `/${qrPath}`}`;
};

const QR_PLACEHOLDER = "/assets/qr-placeholder.png";

const QrModal = ({
  item,
  onClose,
  tokens,
  primary,
}: {
  item: Item;
  onClose: () => void;
  tokens: any;
  primary: string;
}) => {
  const qrUrl = resolveQrUrl(item.qrPath);

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR_${item.name}_${item.itemCode}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, "_blank");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full space-y-4 relative"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-lg leading-none hover:opacity-70"
          style={{ background: tokens.cardHover, color: tokens.muted }}
        >
          ×
        </button>

        {/* Item info */}
        <div>
          <h2
            className="font-bold text-base pr-8"
            style={{ color: tokens.text }}
          >
            {item.name}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
            Code: {item.itemCode} &nbsp;·&nbsp; ID: #{item.itemId}
          </p>
        </div>

        {/* QR image */}
        <div className="flex justify-center">
          {qrUrl ? (
            <div
              className="p-3 rounded-xl"
              style={{
                background: "#fff",
                border: `1px solid ${tokens.border}`,
              }}
            >
              <img
                src={qrUrl}
                alt={`QR for ${item.name}`}
                className="w-52 h-52 object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = QR_PLACEHOLDER;
                  img.style.opacity = "0.35";
                  img.onerror = null;
                  const warn = img.nextElementSibling as HTMLElement | null;
                  if (warn) warn.style.display = "block";
                }}
              />
              <p
                className="hidden text-xs text-center mt-2 px-1"
                style={{ color: "#8a2a2a" }}
              >
                QR image not reachable.
                <br />
                Make sure the backend is running at{" "}
                <strong>localhost:8080</strong>
                <br />
                and the file exists at{" "}
                <code className="text-[10px] break-all">{qrUrl}</code>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="p-3 rounded-xl"
                style={{
                  background: "#fff",
                  border: `1px solid ${tokens.border}`,
                }}
              >
                <img
                  src={QR_PLACEHOLDER}
                  alt="QR placeholder"
                  className="w-52 h-52 object-contain"
                  style={{ opacity: 0.25 }}
                />
              </div>
              <p
                className="text-xs text-center"
                style={{ color: tokens.muted }}
              >
                No QR code generated yet.
                <br />
                Re-save this item to generate one.
              </p>
            </div>
          )}
        </div>

        {/* Resolved URL info */}
        {qrUrl && (
          <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{ background: tokens.cardHover }}
          >
            <p className="font-semibold mb-0.5" style={{ color: tokens.muted }}>
              QR image URL:
            </p>
            <p className="font-mono break-all" style={{ color: tokens.text }}>
              {qrUrl}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {qrUrl && (
            <button
              onClick={handleDownload}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: primary }}
            >
              ⬇ Download PNG
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{
              background: tokens.cardHover,
              color: tokens.text,
              border: `1px solid ${tokens.border}`,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────
const ViewInventory: React.FC = () => {
  const { tokens, primary } = useTheme();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [qrItem, setQrItem] = useState<Item | null>(null); // modal target

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get<Item[]>("http://localhost:8080/api/admin/item/fetchAll", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setInventory(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch inventory:", err);
        setLoading(false);
      });

    console.log(inventory);
  }, []);

  const filtered = inventory.filter(
    (i) =>
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.categoryDescription?.toLowerCase().includes(search.toLowerCase()) ||
      i.itemCode?.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const statusStyle = (qty: number, reorder: number): React.CSSProperties => {
    if (qty <= 0) return { background: "#fbd8d4", color: "#8a2a2a" };
    if (qty <= reorder) return { background: "#fbe8c8", color: "#8a5a1a" };
    return { background: "#d4e8d4", color: "#2d6a2d" };
  };
  const statusLabel = (qty: number, reorder: number) =>
    qty <= 0 ? "Out of Stock" : qty <= reorder ? "Low Stock" : "In Stock";

  const card = {
    background: tokens.card,
    border: `1px solid ${tokens.border}`,
  };

  // ── QR cell / card helper ──────────────────────────────────────
  // resolveQrUrl handles both full URLs and relative paths from backend
  const QrThumb = ({ item }: { item: Item }) => {
    const qrUrl = resolveQrUrl(item.qrPath);

    return qrUrl ? (
      <button
        onClick={() => setQrItem(item)}
        title="Click to view full QR code"
      >
        <img
          src={qrUrl}
          alt={`QR for ${item.itemCode}`}
          className="w-12 h-12 rounded object-contain"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = QR_PLACEHOLDER; // fallback if image not reachable
            img.style.opacity = "0.4";
            img.onerror = null;
          }}
        />
      </button>
    ) : (
      <img
        src={QR_PLACEHOLDER}
        alt="No QR yet"
        className="w-12 h-12 rounded object-contain"
      />
    );
  };
 

  return (
    <div
      className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5"
      style={{ minHeight: "100%", fontFamily: "inherit" }}
    >
      {/* QR Modal */}
      {qrItem && (
        <QrModal
          item={qrItem}
          onClose={() => setQrItem(null)}
          tokens={tokens}
          primary={primary}
        />
      )}

      <Breadcrumb page="View Inventory" parent="Inventory" />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Inventory
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            Browse all inventory items
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search items..."
              className="pl-8 pr-4 py-2 rounded-xl text-sm outline-none w-full sm:w-52"
              style={{
                background: tokens.card,
                color: tokens.text,
                border: `1px solid ${tokens.border}`,
              }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span
              className="absolute left-2.5 top-2.5 text-xs"
              style={{ color: tokens.muted }}
            >
              🔍
            </span>
          </div>
          <button
            onClick={() => navigate("/admin/inventory/add")}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
            style={{ background: primary }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Stats row */}
      {!loading && inventory.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Total Items", value: inventory.length, color: primary },
            {
              label: "In Stock",
              value: inventory.filter((i) => i.quantityInStock > i.reOrderLevel)
                .length,
              color: "#2d6a2d",
            },
            {
              label: "Low Stock",
              value: inventory.filter(
                (i) =>
                  i.quantityInStock > 0 && i.quantityInStock <= i.reOrderLevel,
              ).length,
              color: "#8a5a1a",
            },
            {
              label: "Out of Stock",
              value: inventory.filter((i) => i.quantityInStock <= 0).length,
              color: "#8a2a2a",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center"
              style={card}
            >
              <p className="text-xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div
          className="py-16 text-center text-sm"
          style={{ color: tokens.muted }}
        >
          Loading inventory…
        </div>
      ) : inventory.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={card}>
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold" style={{ color: tokens.text }}>
            No inventory items yet
          </p>
          <p className="text-xs mt-1 mb-4" style={{ color: tokens.muted }}>
            Add items to see them here.
          </p>
          <button
            onClick={() => navigate("/admin/inventory/add")}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: primary }}
          >
            + Add First Item
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2.5">
            {paginated.length > 0 ? (
              paginated.map((item) => {
                const qty = item.quantityInStock ?? 0;
                const reorder = item.reOrderLevel ?? 0;
                const price = item.unitPrice ?? 0;
                return (
                  <div
                    key={item.itemId}
                    className="rounded-xl overflow-hidden"
                    style={card}
                  >
                    {/* Card header: name + status badge */}
                    <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold leading-snug"
                          style={{ color: tokens.text }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-xs mt-0.5 truncate"
                          style={{ color: tokens.muted }}
                        >
                          <span className="font-mono">{item.itemCode}</span>
                          {item.categoryDescription
                            ? ` · ${item.categoryDescription}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5"
                        style={statusStyle(qty, reorder)}
                      >
                        {statusLabel(qty, reorder)}
                      </span>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: tokens.border }} />

                    {/* Stats row */}
                    <div
                      className="grid grid-cols-3 divide-x px-0 py-2"
                      style={{ borderColor: tokens.border }}
                    >
                      <div className="flex flex-col items-center py-1">
                        <p
                          className="text-xs font-bold"
                          style={{
                            color:
                              qty <= 0
                                ? "#ef4444"
                                : qty <= reorder
                                  ? "#f59e0b"
                                  : tokens.text,
                          }}
                        >
                          {qty}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: tokens.muted }}
                        >
                          In Stock
                        </p>
                      </div>
                      <div
                        className="flex flex-col items-center py-1"
                        style={{
                          borderLeft: `1px solid ${tokens.border}`,
                          borderRight: `1px solid ${tokens.border}`,
                        }}
                      >
                        <p
                          className="text-xs font-bold"
                          style={{ color: tokens.text }}
                        >
                          ${price.toFixed(2)}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: tokens.muted }}
                        >
                          Unit Price
                        </p>
                      </div>
                      <div className="flex flex-col items-center py-1">
                        <p
                          className="text-xs font-bold"
                          style={{ color: tokens.text }}
                        >
                          {reorder}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: tokens.muted }}
                        >
                          Reorder At
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: tokens.border }} />

                    {/* Supplier + QR row */}
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[10px] uppercase tracking-wider font-semibold mb-0.5"
                          style={{ color: tokens.muted }}
                        >
                          Supplier
                        </p>
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: tokens.text }}
                        >
                          {item.supplierName || "—"}
                        </p>
                      </div>
                      <QrThumb item={item} />
                    </div>

                    {/* Action footer */}
                    <div className="px-3 pb-3">
                      <button
                        onClick={() => navigate("/admin/inventory/manage")}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold text-center"
                        style={{
                          background: tokens.cardHover,
                          color: tokens.sub,
                          border: `1px solid ${tokens.border}`,
                        }}
                      >
                        ✏️ Manage this Item
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center rounded-xl" style={card}>
                <p className="text-2xl mb-2">🔍</p>
                <p
                  className="text-sm font-medium"
                  style={{ color: tokens.text }}
                >
                  No items match your search.
                </p>
                <p className="text-xs mt-1" style={{ color: tokens.muted }}>
                  Try a different name, code or category.
                </p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div
            className="hidden sm:block rounded-2xl overflow-hidden"
            style={card}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[780px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                    {[
                      "ID",
                      "Name",
                      "Code",
                      "Category",
                      "Supplier",
                      "Qty",
                      "Reorder",
                      "Price",
                      "Status",
                      "QR",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                        style={{ color: tokens.muted, whiteSpace: "nowrap" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length > 0 ? (
                    paginated.map((item, i) => {
                      const qty = item.quantityInStock ?? 0;
                      const reorder = item.reOrderLevel ?? 0;
                      const price = item.unitPrice ?? 0;
                      return (
                        <tr
                          key={item.itemId}
                          style={{
                            borderBottom:
                              i < paginated.length - 1
                                ? `1px solid ${tokens.border}`
                                : "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              tokens.cardHover)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            className="px-4 py-3 text-xs"
                            style={{ color: tokens.muted }}
                          >
                            #{item.itemId}
                          </td>
                          <td
                            className="px-4 py-3 font-medium max-w-[140px]"
                            style={{ color: tokens.text }}
                          >
                            <span className="block truncate" title={item.name}>
                              {item.name}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 font-mono text-xs whitespace-nowrap"
                            style={{ color: tokens.muted }}
                          >
                            {item.itemCode}
                          </td>
                          <td
                            className="px-4 py-3 max-w-[110px]"
                            style={{ color: tokens.muted }}
                          >
                            <span
                              className="block truncate"
                              title={item.categoryDescription || ""}
                            >
                              {item.categoryDescription || "—"}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 max-w-[110px]"
                            style={{ color: tokens.muted }}
                          >
                            <span
                              className="block truncate"
                              title={item.supplierName || ""}
                            >
                              {item.supplierName || "—"}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 font-semibold whitespace-nowrap"
                            style={{
                              color:
                                qty <= 0
                                  ? "#ef4444"
                                  : qty <= reorder
                                    ? "#f59e0b"
                                    : tokens.text,
                            }}
                          >
                            {qty}
                          </td>
                          <td
                            className="px-4 py-3 text-xs whitespace-nowrap"
                            style={{ color: tokens.muted }}
                          >
                            {reorder}
                          </td>
                          <td
                            className="px-4 py-3 whitespace-nowrap"
                            style={{ color: tokens.text }}
                          >
                            ${price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                              style={statusStyle(qty, reorder)}
                            >
                              {statusLabel(qty, reorder)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <QrThumb item={item} />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                navigate("/admin/inventory/manage")
                              }
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                              style={{
                                background: "#dde4f0",
                                color: "#3a4e7a",
                              }}
                            >
                              ✏️ Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-sm"
                        style={{ color: tokens.muted }}
                      >
                        No items match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span className="text-xs" style={{ color: tokens.muted }}>
                Showing{" "}
                <span className="font-semibold" style={{ color: tokens.text }}>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold" style={{ color: tokens.text }}>
                  {filtered.length}
                </span>{" "}
                items
                {search && <span> · filtered</span>}
              </span>
              <div className="flex gap-1.5 flex-wrap items-center">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hidden sm:block"
                  style={{
                    background: tokens.card,
                    color: tokens.muted,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                  style={{
                    background: tokens.card,
                    color: tokens.muted,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page =
                    Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  return page <= totalPages ? (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background:
                          page === currentPage ? primary : tokens.card,
                        color: page === currentPage ? "#fff" : tokens.muted,
                        border: `1px solid ${tokens.border}`,
                      }}
                    >
                      {page}
                    </button>
                  ) : null;
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
                  style={{
                    background: tokens.card,
                    color: tokens.muted,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  Next →
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 hidden sm:block"
                  style={{
                    background: tokens.card,
                    color: tokens.muted,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewInventory;
