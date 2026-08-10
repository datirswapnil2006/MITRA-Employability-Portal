import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Logo from "./common/Logo";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  User,
  ShieldCheck,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function DashboardLayout({ active, links, onNavigate, children }) {
  const { user, logout } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile slide drawer
  
  // Sidebar collapsed state for desktop/tablet with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) return JSON.parse(saved);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return true;
    }
    return false;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" || false;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Group links into logical categories
  const getGroupedLinks = () => {
    if (user?.role === "admin") {
      return [
        {
          category: "MAIN",
          items: links.filter((l) => ["overview", "students"].includes(l.key)),
        },
        {
          category: "LEARNING & ASSESSMENT",
          items: links.filter((l) => ["assessments", "materials"].includes(l.key)),
        },
        {
          category: "ANALYTICS & SECURITY",
          items: links.filter((l) => ["proctoring", "results"].includes(l.key)),
        },
        {
          category: "SYSTEM",
          items: links.filter((l) => ["settings"].includes(l.key)),
        },
      ].filter((g) => g.items.length > 0);
    }


    return [
      {
        category: "MAIN",
        items: links.filter((l) => ["dashboard"].includes(l.key)),
      },
      {
        category: "ASSESSMENTS",
        items: links.filter((l) => ["available-tests"].includes(l.key)),
      },
      {
        category: "PREPARATION",
        items: links.filter((l) => ["practice"].includes(l.key)),
      },
      {
        category: "PERFORMANCE & ACCOUNT",
        items: links.filter((l) => ["results", "profile"].includes(l.key)),
      },
    ].filter((g) => g.items.length > 0);
  };

  const groupedLinks = getGroupedLinks();

  const isChildActive = (link) =>
    link.children && link.children.some((c) => active === c.key || active.startsWith(c.key + "/") || active === c.path);

  const toggleGroup = (key) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const isGroupOpen = (link) =>
    expandedGroups[link.key] !== undefined ? expandedGroups[link.key] : isChildActive(link);

  const renderLink = (link, depth = 0) => {
    const Icon = link.icon;
    const hasChildren = link.children && link.children.length > 0;
    const isActive = active === link.key || active === link.path;
    const groupOpen = hasChildren && isGroupOpen(link);
    const childActive = hasChildren && isChildActive(link);

    return (
      <div key={link.key} className="w-full min-w-0">
        <button
          title={isCollapsed ? link.label : undefined}
          onClick={() => {
            if (isCollapsed) {
              setIsCollapsed(false);
            }
            if (hasChildren) {
              toggleGroup(link.key);
            } else {
              onNavigate(link.path || link.key);
              setSidebarOpen(false);
            }
          }}
          className={`
            group flex items-center w-full min-w-0 text-left transition-all duration-300 ease-in-out rounded-xl text-[13px] font-medium
            ${isCollapsed ? "justify-center p-2.5" : depth === 0 ? "px-3 py-2 gap-2.5" : "pl-7 pr-2.5 py-1.5 gap-2"}
            ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold"
                : childActive
                ? "bg-slate-800/90 text-white font-medium"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
            }
          `}
        >
          {Icon && (
            <Icon
              size={depth === 0 ? 18 : 15}
              className={`shrink-0 transition-colors ${
                isActive ? "text-white" : childActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
              }`}
            />
          )}

          {!isCollapsed && (
            <>
              <span className="flex-1 min-w-0 truncate">{link.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse ml-0.5" />
              )}
              {hasChildren && (
                groupOpen
                  ? <ChevronDown size={13} className="shrink-0 text-slate-400 ml-0.5" />
                  : <ChevronRight size={13} className="shrink-0 text-slate-400 ml-0.5" />
              )}
            </>
          )}
        </button>

        {!isCollapsed && hasChildren && groupOpen && (
          <div className="mt-1 mb-1.5 space-y-0.5 animate-fadeIn">
            {link.children.map((child) => renderLink(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-full max-w-full bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 ease-in-out select-none overflow-hidden">
      {/* Brand Header */}
      <div className={`p-3.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {isCollapsed ? (
          <Logo variant="compact" size="sm" />
        ) : (
          <Logo variant="sidebar" size="sm" showSubtitle={true} subtitleText="AI Placement Portal" />
        )}

        {/* Desktop Collapse / Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* Role Pill Header */}
      {!isCollapsed && (
        <div className="px-3.5 py-2 bg-slate-950/20 border-b border-slate-800/40 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {user?.role === "admin" ? (
              <>
                <ShieldCheck size={11} /> Admin Console
              </>
            ) : (
              <>
                <GraduationCap size={11} /> Student Console
              </>
            )}
          </span>
          <span className="text-[9.5px] text-slate-500 font-mono">v2.4</span>
        </div>
      )}

      {/* Navigation Links Grouped */}
      <nav className={`flex-1 p-2.5 space-y-4 overflow-y-auto scrollbar-thin ${isCollapsed ? "flex flex-col items-center space-y-1" : ""}`}>
        {groupedLinks.map((group, idx) => (
          <div key={group.category || idx} className="space-y-1 w-full">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {group.category}
              </div>
            )}
            {group.items.map((link) => renderLink(link))}
          </div>
        ))}
      </nav>

      {/* Compact User Profile & Logout */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 mt-auto">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-slate-100 truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div
              title={`${user?.name} (${user?.email})`}
              className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm"
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Desktop (Width 240px expanded vs 72px collapsed) */}
      <aside
        className={`hidden lg:flex shrink-0 sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          className="absolute top-3.5 right-3 text-slate-400 hover:text-white p-1 z-50 bg-slate-800 rounded-lg border border-slate-700"
          onClick={() => setSidebarOpen(false)}
          title="Close Sidebar"
        >
          <X size={16} />
        </button>
        {sidebarContent}
      </aside>

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open Sidebar"
            >
              <Menu size={18} />
            </button>

            {/* Desktop Hamburger / Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
              title={isCollapsed ? "Expand Sidebar (☰)" : "Collapse Sidebar"}
            >
              {isCollapsed ? <Menu size={17} /> : <PanelLeftClose size={17} />}
            </button>

            {/* Breadcrumb Header */}
            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <Logo size="sm" showSubtitle={false} />
              <span className="text-slate-300 dark:text-slate-700 font-light">/</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">
                {active
                  ? active
                      .split("/")
                      .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))
                      .join(" / ")
                  : "Dashboard"}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark Mode Switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all relative"
              >
                <Bell size={17} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Notifications
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                      2 New
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Welcome to MITRA Portal</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Explore your placement readiness analytics and practice assessments.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Placement Assessment Ready</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Mock assessments and AI practice tests are available now.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[90px] truncate">
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fadeIn">
                  <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate(user?.role === "admin" ? "settings" : "profile");
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <User size={14} /> Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 mt-1"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area Container */}
        <main className="flex-1 p-4 lg:p-7 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
