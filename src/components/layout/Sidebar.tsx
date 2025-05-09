import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Home, Package, Users, ListChecks, Plus, Truck, Settings, ScanLine, Printer } from "lucide-react";

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="w-64 flex-none bg-slate-100 dark:bg-slate-900 h-full py-4 px-3 border-r border-slate-200 dark:border-slate-800">
      <nav className="space-y-6">
        <div>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
            }
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {user?.role === "admin" && (
          <>
            <div>Admin Links</div>
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Package className="h-4 w-4" />
                  <span>Product Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/stockin"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Plus className="h-4 w-4" />
                  <span>Stock In Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/stockout"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Truck className="h-4 w-4" />
                  <span>Stock Out Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/salesinquiries"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <ListChecks className="h-4 w-4" />
                  <span>Sales Inquiries</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/settings"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/barcodes"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Printer className="h-4 w-4" />
                  <span>Barcode Management</span>
                </NavLink>
              </li>
            </ul>
          </>
        )}

        {user?.role === "warehouse_manager" && (
          <>
            <div>Warehouse Manager</div>
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/manager/stockin"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Plus className="h-4 w-4" />
                  <span>Stock In Processing</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/manager/stockout"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Truck className="h-4 w-4" />
                  <span>Stock Out Approval</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/manager/inventory"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Package className="h-4 w-4" />
                  <span>Inventory Lookup</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/manager/barcode-lookup"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Barcode Lookup</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/barcodes"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Printer className="h-4 w-4" />
                  <span>Barcode Management</span>
                </NavLink>
              </li>
            </ul>
          </>
        )}

        {user?.role === "field_operator" && (
          <>
            <div>Field Operator</div>
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/operator/stockout"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <Truck className="h-4 w-4" />
                  <span>New Stock Out</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/operator/submissions"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <ListChecks className="h-4 w-4" />
                  <span>My Submissions</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/operator/barcode-lookup"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Barcode Lookup</span>
                </NavLink>
              </li>
            </ul>
          </>
        )}

        {user?.role === "sales_operator" && (
          <>
            <div>Sales Operator</div>
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/sales/inquiries"
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center space-x-2 bg-slate-200 text-slate-900 font-medium px-2 py-2 rounded dark:bg-slate-700 dark:text-slate-50"
                      : "flex items-center space-x-2 text-slate-900 hover:bg-slate-200 px-2 py-2 rounded dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  <ListChecks className="h-4 w-4" />
                  <span>Sales Inquiries</span>
                </NavLink>
              </li>
            </ul>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
