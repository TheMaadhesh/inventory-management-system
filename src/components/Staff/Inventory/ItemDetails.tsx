import { useState, useEffect } from "react";
import axios from "axios";
import { Eye } from "lucide-react";
import { useTheme, Breadcrumb } from "../StaffNavbar";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  reorder: number;
  qrPath: string;
  lastUpdated: string;
  description: string;
}

const ItemDetails = () => {
  const { tokens } = useTheme();
  const token = localStorage.getItem("token");

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get<any[]>(
        "http://localhost:8080/api/staff/item/fetchAll",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const mapped: InventoryItem[] = res.data.map((item) => {
        const stock = item.quantityInStock ?? 0;
        const reorder = item.reOrderLevel ?? 0;

        let status: "In Stock" | "Low Stock" | "Out of Stock";

        if (stock === 0) status = "Out of Stock";
        else if (stock <= reorder) status = "Low Stock";
        else status = "In Stock";

        return {
          id: item.itemId,
          name: item.name,
          category: item.categoryDescription ?? "General",
          quantity: stock,
          price: item.unitPrice ?? 0,
          reorder: reorder,
          qrPath: item.qrPath ?? "",
          description: item.description ?? "",
          lastUpdated: new Date().toISOString().split("T")[0],
          status,
        };
      });

      setItems(mapped);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      String(i.id).includes(search),
  );

  const statusStyle = (s: string): React.CSSProperties => {
    if (s === "In Stock") return { background: "#d4e8d4", color: "#2d6a2d" };
    if (s === "Low Stock") return { background: "#fbe8c8", color: "#8a5a1a" };
    return { background: "#fbd8d4", color: "#8a2a2a" };
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Breadcrumb page="Item Details" parent="Inventory" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>
            Item Details
          </h1>
          <p className="text-sm" style={{ color: tokens.muted }}>
            Click any item to view full details
          </p>
        </div>

        <div className="relative w-full sm:w-56">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: tokens.card,
              color: tokens.text,
              border: `1px solid ${tokens.border}`,
            }}
          />
        </div>
      </div>

      {/* QR Code Modal */}
      {qrPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setQrPreview(null)}
        >
          <div
            className="p-6 rounded-2xl shadow-xl"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-lg font-semibold mb-4 text-center"
              style={{ color: tokens.text }}
            >
              QR Code
            </h2>

            <img
              src={`${qrPreview}`}
              alt="QR Code"
              className="w-64 h-64 object-contain"
            />

            <button
              onClick={() => setQrPreview(null)}
              className="mt-4 w-full py-2 rounded-xl text-white"
              style={{ background: "#ef4444" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl"
            style={{
              background: tokens.card,
              border: `1px solid ${tokens.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-start justify-between p-5"
              style={{ borderBottom: `1px solid ${tokens.border}` }}
            >
              <div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={statusStyle(selected.status)}
                >
                  {selected.status}
                </span>

                <h2
                  className="font-bold text-lg mt-2"
                  style={{ color: tokens.text }}
                >
                  {selected.name}
                </h2>

                <p style={{ color: tokens.muted }}>{selected.category}</p>
              </div>

              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="p-5 space-y-3">
              {[
                { label: "Item ID", value: selected.id },
                { label: "Category", value: selected.category },
                { label: "Quantity", value: selected.quantity },
                { label: "Reorder Level", value: selected.reorder },
                { label: "Unit Price", value: `$${selected.price}` },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between px-3 py-2 rounded-xl"
                  style={{ background: tokens.cardHover }}
                >
                  <span style={{ color: tokens.muted }}>{row.label}</span>
                  <span style={{ color: tokens.text }}>{row.value}</span>
                </div>
              ))}

              <div
                className="px-3 py-2 rounded-xl"
                style={{ background: tokens.cardHover }}
              >
                <p className="text-xs font-bold">Description</p>
                <p>{selected.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: tokens.card,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
              {[
                "ID",
                "Name",
                "Category",
                "Reorder Level",
                "Qty",
                "Price",
                "QR Code",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase"
                  style={{ color: tokens.muted }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                onClick={() => setSelected(item)}
                style={{ cursor: "pointer" }}
              >
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3 font-semibold">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">{item.reorder}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">${item.price}</td>

                {/* QR View Icon */}
                <td
                  className="px-4 py-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQrPreview(item.qrPath);
                  }}
                >
                  <Eye
                    size={20}
                    style={{ cursor: "pointer", color: "#3b82f6" }}
                  />
                </td>

                <td className="px-4 py-3">
                  <span
                    className="px-2 py-1 rounded-full text-xs"
                    style={statusStyle(item.status)}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          className="px-4 py-2"
          style={{ borderTop: `1px solid ${tokens.border}` }}
        >
          <p style={{ color: tokens.muted }}>
            Showing {filtered.length} of {items.length} items
          </p>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
