import { useState } from "react";
import { useTheme, Breadcrumb, FilterButton } from "../StaffNavbar";

interface Category { id: number; name: string; description: string; status: "Active" | "Inactive"; itemCount: number; }

const ViewCategories = () => {
  const { tokens, primary } = useTheme();
  const [categories] = useState<Category[]>([
    { id: 1, name: "Electronics", description: "Electronic gadgets and devices", status: "Active", itemCount: 42 },
    { id: 2, name: "Stationery", description: "Office and writing supplies", status: "Active", itemCount: 28 },
    { id: 3, name: "Furniture", description: "Home and office furniture", status: "Inactive", itemCount: 15 },
    { id: 4, name: "Peripherals", description: "Computer peripherals and accessories", status: "Active", itemCount: 36 },
    { id: 5, name: "Accessories", description: "General accessories and add-ons", status: "Active", itemCount: 21 },
  ]);
  const [filterStatus, setFilterStatus] = useState<"All"|"Active"|"Inactive">("All");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = categories.filter(c => filterStatus === "All" || c.status === filterStatus);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <Breadcrumb page="View Categories" parent="Categories" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: tokens.text }}>Categories</h1>
          <p className="text-sm" style={{ color: tokens.muted }}>Browse product categories (read-only)</p>
        </div>
        <FilterButton active={showFilter} onClick={() => setShowFilter(!showFilter)} />
      </div>

      {showFilter && (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl" style={{ background:tokens.card, border:`1px solid ${tokens.border}` }}>
          {(["All","Active","Inactive"] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background:filterStatus===s?primary:tokens.cardHover, color:filterStatus===s?"#fff":tokens.sub }}>{s}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          {label:"Total",    value:categories.length,                                      c:"#3a4e7a"},
          {label:"Active",   value:categories.filter(c=>c.status==="Active").length,       c:"#2d6a2d"},
          {label:"Inactive", value:categories.filter(c=>c.status==="Inactive").length,     c:"#8a5a1a"},
          {label:"Items",    value:categories.reduce((a,c)=>a+c.itemCount,0),              c:primary  },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 sm:p-4 text-center" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: s.c }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: tokens.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filtered.map((cat) => (
          <div key={cat.id} className="p-3 rounded-xl" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: tokens.text }}>{cat.name}</p>
                <p className="text-xs mt-0.5" style={{ color: tokens.sub }}>{cat.description}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0" style={cat.status==="Active"?{background:"#d4e8d4",color:"#2d6a2d"}:{background:"#fbd8d4",color:"#8a2a2a"}}>{cat.status}</span>
            </div>
            <p className="text-xs" style={{ color:tokens.muted }}>{cat.itemCount} items in this category</p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ background: tokens.card, border: `1px solid ${tokens.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.border}` }}>
                {["Name","Description","Items","Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase" style={{ color: tokens.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat, i) => (
                <tr key={cat.id} style={{ borderBottom: i<filtered.length-1?`1px solid ${tokens.border}`:"none" }}
                  onMouseEnter={e=>(e.currentTarget.style.background=tokens.cardHover)}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td className="px-4 py-3 font-medium" style={{ color: tokens.text }}>{cat.name}</td>
                  <td className="px-4 py-3" style={{ color: tokens.sub }}>{cat.description}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: tokens.text }}>{cat.itemCount}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={cat.status==="Active"?{background:"#d4e8d4",color:"#2d6a2d"}:{background:"#fbd8d4",color:"#8a2a2a"}}>{cat.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5" style={{ borderTop:`1px solid ${tokens.border}` }}>
          <p className="text-xs" style={{ color:tokens.muted }}>Read-only view. Contact admin to manage categories.</p>
        </div>
      </div>
    </div>
  );
};

export default ViewCategories;
