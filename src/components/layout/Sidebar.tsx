
import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  Home, 
  Package, 
  Users, 
  ListChecks, 
  Plus, 
  Truck, 
  Settings, 
  ScanLine, 
  Printer, 
  ShoppingBag,
  BarChart4,
  MessageSquare,
  Store,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { user } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center space-x-2 rounded-md px-3 py-2 text-sm transition-colors",
      isActive
        ? "bg-slate-200 text-slate-900 font-medium dark:bg-slate-700 dark:text-slate-50"
        : "text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
    );

  const sectionHeadingClass = "px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";

  return (
    <div className={cn(
      "h-full py-6 px-3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 overflow-hidden",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "flex items-center justify-center mb-8",
        collapsed ? "px-0" : "px-3"
      )}>
        {collapsed ? (
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">AW</h1>
        ) : (
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Agile Warehouse</h1>
        )}
      </div>

      <nav className="space-y-6 flex-1 overflow-y-auto scrollbar-thin">
        {/* Dashboard link for all users */}
        <div>
          <NavLink
            to={user?.role === "admin" ? "/admin" : 
                user?.role === "warehouse_manager" ? "/manager" :
                user?.role === "field_operator" ? "/operator" : 
                user?.role === "sales_operator" ? "/sales" : "/"}
            className={navLinkClass}
            end
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </div>

        {user?.role === "admin" && (
          <>
            <div>
              {!collapsed && <p className={sectionHeadingClass}>Administration</p>}
              <ul className="space-y-1 mt-2">
                <li>
                  <NavLink to="/admin/users" className={navLinkClass}>
                    <Users className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>User Management</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/products" className={navLinkClass}>
                    <Package className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Product Management</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/warehouses" className={navLinkClass}>
                    <Store className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Warehouse Management</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/inventory" className={navLinkClass}>
                    <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Inventory Management</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/stock-in" className={navLinkClass}>
                    <Plus className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Stock In Management</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/stock-out" className={navLinkClass}>
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Stock Out Management</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/sales" className={navLinkClass}>
                    <ListChecks className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Sales Inquiries</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/barcodes" className={navLinkClass}>
                    <Printer className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Barcode Management</span>}
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        )}

        {user?.role === "warehouse_manager" && (
          <>
            <div>
              {!collapsed && <p className={sectionHeadingClass}>Warehouse Operations</p>}
              <ul className="space-y-1 mt-2">
                <li>
                  <NavLink to="/manager/stock-in" className={navLinkClass}>
                    <Plus className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Stock In Processing</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/manager/stock-out-approval" className={navLinkClass}>
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Stock Out Approval</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/manager/inventory" className={navLinkClass}>
                    <Package className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Inventory Lookup</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/manager/barcode" className={navLinkClass}>
                    <ScanLine className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Barcode Lookup</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/barcodes" className={navLinkClass}>
                    <Printer className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Barcode Management</span>}
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        )}

        {user?.role === "field_operator" && (
          <>
            <div>
              {!collapsed && <p className={sectionHeadingClass}>Field Operations</p>}
              <ul className="space-y-1 mt-2">
                <li>
                  <NavLink to="/operator/stock-out" className={navLinkClass}>
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>New Stock Out</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/operator/stock-in" className={navLinkClass}>
                    <Plus className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>New Stock In</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/operator/submissions" className={navLinkClass}>
                    <ListChecks className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>My Submissions</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/operator/barcode" className={navLinkClass}>
                    <ScanLine className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Barcode Lookup</span>}
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        )}

        {user?.role === "sales_operator" && (
          <>
            <div>
              {!collapsed && <p className={sectionHeadingClass}>Sales Operations</p>}
              <ul className="space-y-1 mt-2">
                <li>
                  <NavLink to="/sales" className={navLinkClass}>
                    <BarChart4 className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/sales/inquiries" className={navLinkClass}>
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Customer Inquiries</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/products" className={navLinkClass}>
                    <Package className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Product Catalogue</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/manager/inventory" className={navLinkClass}>
                    <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>Inventory Status</span>}
                  </NavLink>
                </li>
              </ul>
            </div>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
