
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlignLeft, ArrowLeftRight, BarChart, Settings, Home, KanbanSquare, LayoutDashboard, ListChecks, LogOut, LucideIcon, Package2, ShoppingCart, User2, Users, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const sidebarItems = [
    {
      role: "admin",
      links: [
        {
          href: "/admin",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/admin/users",
          label: "Users",
          icon: Users,
        },
        {
          href: "/admin/products",
          label: "Products",
          icon: Package2,
        },
        {
          href: "/admin/warehouses",
          label: "Warehouses",
          icon: Warehouse,
        },
        {
          href: "/admin/stock-in",
          label: "Stock In",
          icon: ListChecks,
        },
        {
          href: "/admin/stock-out",
          label: "Stock Out",
          icon: ShoppingCart,
        },
        {
          href: "/admin/inventory",
          label: "Inventory",
          icon: KanbanSquare,
        },
        {
          href: "/admin/sales-inquiries",
          label: "Sales Inquiries",
          icon: BarChart,
        },
        {
          href: "/admin/transfers",
          label: "Transfers",
          icon: ArrowLeftRight,
        },
        {
          href: "/admin/settings",
          label: "Settings",
          icon: Settings,
        },
      ],
    },
    {
      role: "warehouse_manager",
      links: [
        {
          href: "/manager",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/manager/stock-in",
          label: "Stock In",
          icon: ListChecks,
        },
        {
          href: "/manager/stock-out",
          label: "Stock Out",
          icon: ShoppingCart,
        },
        {
          href: "/manager/inventory",
          label: "Inventory",
          icon: KanbanSquare,
        },
        {
          href: "/manager/transfers",
          label: "Transfers",
          icon: ArrowLeftRight,
        },
        {
          href: "/manager/settings",
          label: "Settings",
          icon: Settings,
        },
      ],
    },
    {
      role: "field_operator",
      links: [
        {
          href: "/field",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/field/stock-in",
          label: "Stock In",
          icon: ListChecks,
        },
        {
          href: "/field/submissions",
          label: "My Submissions",
          icon: ListChecks,
        },
        {
          href: "/field/settings",
          label: "Settings",
          icon: Settings,
        },
      ],
    },
    {
      role: "sales_operator",
      links: [
        {
          href: "/sales",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/sales/inquiries",
          label: "Inquiries",
          icon: ListChecks,
        },
        {
          href: "/sales/settings",
          label: "Settings",
          icon: Settings,
        },
      ],
    },
  ];

  const relevantLinks = sidebarItems.find((item) => item.role === user?.role)?.links || [];

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // Display sidebar as a vertical navigation menu, whether for mobile or desktop
  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="p-4 flex items-center gap-2">
        <Warehouse className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Agile WMS</span>
      </div>
      
      <Separator className="mb-4" />
      
      <div className="flex-1 overflow-auto">
        <nav className="space-y-1 px-2">
          {relevantLinks.map((link, index) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            
            return (
              <Link
                key={index}
                to={link.href}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive 
                    ? "bg-accent text-accent-foreground font-medium" 
                    : "hover:bg-accent/80 hover:text-accent-foreground text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <Separator className="mt-4" />
      
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 w-full rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground text-left">
              <Avatar className="h-6 w-6">
                <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}</AvatarFallback>
                <AvatarImage src={user?.avatar_url} alt={user?.name || "User"} />
              </Avatar>
              <div className="flex-1 flex-col">
                <p className="font-medium truncate">{user?.name || user?.username || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role && formatRole(user.role)}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User2 className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

function formatRole(role?: string): string {
  if (!role) return 'User';
  
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default Sidebar;
