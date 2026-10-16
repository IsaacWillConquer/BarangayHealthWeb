import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { staffNavItems, adminNavItems, residentNavItems } from "../components/navItems";
import { useAuth } from "../context/useAuth";

const configs = {
  Admin: { items: adminNavItems, subtitle: "Admin Panel" },
  Staff: { items: staffNavItems, subtitle: "Staff Panel" },
  Resident: { items: residentNavItems, subtitle: "Resident Portal" },
};

export default function PanelLayout({ role }) {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    setUser(null);
    navigate("/login");
  }

  const { items, subtitle } = configs[role] || configs.Staff;

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100">
      <Sidebar items={items} subtitle={subtitle} onLogout={handleLogout} />
      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div key={location.pathname} className="animate-rise-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
