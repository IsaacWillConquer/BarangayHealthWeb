import { NavLink } from "react-router-dom";
import { staffNavItems } from "./navItems";

const defaultItems = staffNavItems;

export default function Sidebar({
  items = defaultItems,
  title = "Barangay Health Portal",
  subtitle = "Staff Panel",
  onLogout,
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto bg-emerald-950 text-emerald-50">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900 text-lg">
          📍
        </div>
        <div>
          <p className="text-sm font-bold leading-tight tracking-wide">
            {title}
          </p>
          <p className="text-xs text-emerald-300">{subtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/staff" || item.to === "/admin" || item.to === "/resident"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "border border-amber-400/60 bg-emerald-900 text-white"
                  : "text-emerald-100/90 hover:bg-emerald-900/60"
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-emerald-900 px-3 py-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-amber-300 transition-colors duration-150 hover:bg-emerald-900/60"
        >
          <span aria-hidden>↩</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
