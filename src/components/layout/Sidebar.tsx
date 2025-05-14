import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlignLeft, ArrowLeftRight, BarChart, Cog6Tooth, Home, KanbanSquare, LayoutDashboard, ListChecks, LogOut, LucideIcon, Package2, Settings, ShoppingCart, User2, Users, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    {
      role: "admin",
      links: [
        {
          href: "/admin",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          href: "/admin/users",
          label: "Users",
          icon: <Users className="h-4 w-4" />,
        },
        {
          href: "/admin/products",
          label: "Products",
          icon: <Package2 className="h-4 w-4" />,
        },
        {
          href: "/admin/warehouses",
          label: "Warehouses",
          icon: <Warehouse className="h-4 w-4" />,
        },
        {
          href: "/admin/stock-in",
          label: "Stock In",
          icon: <ListChecks className="h-4 w-4" />,
        },
        {
          href: "/admin/stock-out",
          label: "Stock Out",
          icon: <ShoppingCart className="h-4 w-4" />,
        },
        {
          href: "/admin/inventory",
          label: "Inventory",
          icon: <KanbanSquare className="h-4 w-4" />,
        },
        {
          href: "/admin/sales-inquiries",
          label: "Sales Inquiries",
          icon: <BarChart className="h-4 w-4" />,
        },
        {
          href: "/admin/transfers",
          label: "Transfers",
          icon: <ArrowLeftRight className="h-4 w-4" />,
        },
        {
          href: "/admin/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
    {
      role: "warehouse_manager",
      links: [
        {
          href: "/manager",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          href: "/manager/stock-in",
          label: "Stock In",
          icon: <ListChecks className="h-4 w-4" />,
        },
        {
          href: "/manager/stock-out",
          label: "Stock Out",
          icon: <ShoppingCart className="h-4 w-4" />,
        },
        {
          href: "/manager/inventory",
          label: "Inventory",
          icon: <KanbanSquare className="h-4 w-4" />,
        },
        {
          href: "/manager/transfers",
          label: "Transfers",
          icon: <ArrowLeftRight className="h-4 w-4" />,
        },
        {
          href: "/manager/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
    {
      role: "field_operator",
      links: [
        {
          href: "/field",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          href: "/field/stock-in",
          label: "Stock In",
          icon: <ListChecks className="h-4 w-4" />,
        },
        {
          href: "/field/submissions",
          label: "My Submissions",
          icon: <ListChecks className="h-4 w-4" />,
        },
        {
          href: "/field/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
    {
      role: "sales_operator",
      links: [
        {
          href: "/sales",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          href: "/sales/inquiries",
          label: "Inquiries",
          icon: <ListChecks className="h-4 w-4" />,
        },
        {
          href: "/sales/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];

  const relevantLinks = sidebarItems.find((item) => item.role === user?.role)?.links || [];

  return (
    <Sheet className={className}>
      <SheetTrigger asChild>
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary h-10 px-4 py-2 lg:hidden">
          <AlignLeft className="mr-2 h-4 w-4" />
          Menu
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-64">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate through the warehouse management system.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <div className="flex flex-col space-y-2">
          {relevantLinks.map((link: NavLink) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "group flex items-center space-x-2 rounded-md p-2 font-medium hover:underline",
                location.pathname === link.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
        <Separator className="my-4" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary h-10 px-4 py-2 w-full">
              <Avatar className="mr-2 h-5 w-5">
                <AvatarImage src="https://github.com/shadcn.png" alt="Your Name" />
                <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <span>{user?.name || user?.username || "User"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User2 className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Cog6Tooth className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SheetContent>
    </Sheet>
  );
};

export default Sidebar;
