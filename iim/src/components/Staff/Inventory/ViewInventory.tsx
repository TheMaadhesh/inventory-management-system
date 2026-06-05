import { useState, useEffect } from "react";
import axios from "axios";
import { useTheme, Breadcrumb, FilterButton } from "../StaffNavbar";

interface InventoryItem {
  itemId: number;
  name: string;
  categoryDescription: string;
  quantityInStock: number;
  unitPrice: number;
  reOrderLevel: number;
}

const ITEMS_PER_PAGE = 10;

const ViewInventory = () => {
  const { tokens, primary } = useTheme();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:8080/api/staff/item/fetchAll", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setInventory(res.data);
      })
      .catch((err) => console.error("Error fetching inventory:", err));
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(inventory.map((i) => i.categoryDescription))),
  ];

  const filtered = inventory.filter(
    (i) =>
      (filterCat === "All" || i.categoryDescription === filterCat) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.categoryDescription.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filtered]);

  const statusStyle = (qty: number, reorder: number): React.CSSProperties => {
    if (qty === 0) return { background: "#fbd8d4", color: "#8a2a2a" };
    if (qty <= reorder) return { background: "#fbe8c8", color: "#8a5a1a" };
    return { background: "#d4e8d4", color: "#2d6a2d" };
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Breadcrumb page="View Inventory" parent="Inventory" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Inventory
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            Browse inventory items (read-only)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <FilterButton
            active={showFilter}
            onClick={() => setShowFilter(!showFilter)}
          />

          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Search items..."
              className="pl-8 pr-4 py-2 rounded-xl text-sm outline-none w-full sm:w-48"
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
        </div>
      </div>

      {/* Category Filter */}
      {showFilter && (
        <div
          className="flex flex-wrap gap-2 p-3 rounded-xl"
          style={{
            background: tokens.card,
            border: `1px solid ${tokens.border}`,
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilterCat(cat);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: filterCat === cat ? primary : tokens.cardHover,
                color: filterCat === cat ? "#fff" : tokens.sub,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2">
        {paginated.length > 0 ? (
          paginated.map((item) => (
            <div
              key={item.itemId}
              className="p-3 rounded-xl"
              style={{
                background: tokens.card,
                border: `1px solid ${tokens.border}`,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: tokens.text }}
                  >
                    {item.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: tokens.sub }}
                  >
                    {item.categoryDescription}
                  </p>
                </div>

                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={statusStyle(
                    item.quantityInStock,
                    item.reOrderLevel
                  )}
                >
                  {item.quantityInStock === 0
                    ? "Out of Stock"
                    : item.quantityInStock <= item.reOrderLevel
                    ? "Low Stock"
                    : "In Stock"}
                </span>
              </div>

              <div
                className="flex items-center justify-between text-xs"
                style={{ color: tokens.muted }}
              >
                <span>ID: #{item.itemId}</span>
                <span>
                  Qty:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: tokens.text }}
                  >
                    {item.quantityInStock}
                  </span>
                </span>
                <span
                  className="font-semibold"
                  style={{ color: tokens.text }}
                >
                  ${item.unitPrice.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div
            className="text-center py-8 text-sm"
            style={{ color: tokens.muted }}
          >
            No items found.
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div
        className="hidden sm:block rounded-2xl overflow-hidden"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {["ID", "Name", "Category", "Quantity", "Price", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase"
                      style={{ color: tokens.muted }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {paginated.map((item) => (
                <tr key={item.itemId}>
                  <td className="px-4 py-3" style={{ color: tokens.muted }}>
                    {item.itemId}
                  </td>

                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: tokens.text }}
                  >
                    {item.name}
                  </td>

                  <td className="px-4 py-3" style={{ color: tokens.sub }}>
                    {item.categoryDescription}
                  </td>

                  <td className="px-4 py-3" style={{ color: tokens.text }}>
                    {item.quantityInStock}
                  </td>

                  <td className="px-4 py-3" style={{ color: tokens.text }}>
                    ${item.unitPrice.toFixed(2)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={statusStyle(
                        item.quantityInStock,
                        item.reOrderLevel
                      )}
                    >
                      {item.quantityInStock === 0
                        ? "Out of Stock"
                        : item.quantityInStock <= item.reOrderLevel
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: `1px solid ${tokens.border}` }}
          >
            <p className="text-xs" style={{ color: tokens.muted }}>
              Page {currentPage} of {totalPages} · {filtered.length} items
            </p>

            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: tokens.cardHover,
                  color: tokens.text,
                  opacity: currentPage === 1 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      background:
                        page === currentPage ? primary : tokens.cardHover,
                      color: page === currentPage ? "#fff" : tokens.text,
                    }}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: tokens.cardHover,
                  color: tokens.text,
                  opacity: currentPage === totalPages ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInventory;