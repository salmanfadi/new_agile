import React from 'react';
import { Outlet } from 'react-router-dom';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter
} from '@/components/ui/sidebar';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Package, 
  Users, 
  Home, 
  PackageSearch, 
  PackagePlus, 
  PackageMinus, 
  MessageSquare, 
  Store, 
  ScanLine, 
  Printer,
  BoxesIcon, 
  Warehouse, 
  Settings,
  LayoutDashboard,
  LogOut,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  
  // Get the current user's initials for the avatar
  const getInitials = () => {
    if (!user?.name) return user?.email?.substring(0, 2).toUpperCase() || 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarHeader>
            <div className="flex items-center space-x-2 px-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Agile Warehouse</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 overflow-y-auto">
            <NavItems role={user?.role} />
          </SidebarContent>
          
          <SidebarFooter className="border-t">
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                    <AvatarImage src={user?.avatar_url} />
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{user?.name || user?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role && formatRole(user.role)}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  aria-label="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="border-b bg-background">
            <div className="flex h-16 items-center px-4 justify-between">
              <SidebarTrigger />
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <span className="text-sm font-medium hidden md:inline-block">
                  {user?.name || user?.email}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

function formatRole(role?: string): string {
  if (!role) return 'User';
  
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface NavItemsProps {
  role?: string;
}

const NavItems: React.FC<NavItemsProps> = ({ role }) => {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    cn(
      "flex w-full items-center gap-2 rounded-md p-2 text-sm",
      isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    );

  // Admin navigation
  if (role === 'admin') {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <NavLink to="/admin" end className={getNavLinkClass}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Inventory</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Inventory">
                <NavLink to="/admin/inventory" className={getNavLinkClass}>
                  <PackageSearch className="h-4 w-4" />
                  <span>Inventory</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Stock In">
                <NavLink to="/admin/stock-in" className={getNavLinkClass}>
                  <PackagePlus className="h-4 w-4" />
                  <span>Stock In</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Stock Out">
                <NavLink to="/admin/stock-out" className={getNavLinkClass}>
                  <PackageMinus className="h-4 w-4" />
                  <span>Stock Out</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Products">
                <NavLink to="/admin/products" className={getNavLinkClass}>
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Warehouses">
                <NavLink to="/admin/warehouses" className={getNavLinkClass}>
                  <Store className="h-4 w-4" />
                  <span>Warehouses</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Users">
                <NavLink to="/admin/profiles" className={getNavLinkClass}>
                  <Users className="h-4 w-4" />
                  <span>User Profiles</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Sales Inquiries">
                <NavLink to="/admin/sales-inquiries" className={getNavLinkClass}>
                  <MessageSquare className="h-4 w-4" />
                  <span>Sales Inquiries</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Barcodes">
                <NavLink to="/admin/barcodes" className={getNavLinkClass}>
                  <Printer className="h-4 w-4" />
                  <span>Barcode Management</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </>
    );
  }

  // Warehouse Manager navigation
  if (role === 'warehouse_manager') {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <NavLink to="/manager" end className={getNavLinkClass}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Warehouse Operations</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Stock In">
                <NavLink to="/manager/stock-in" className={getNavLinkClass}>
                  <PackagePlus className="h-4 w-4" />
                  <span>Stock In Processing</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Stock Out">
                <NavLink to="/manager/stock-out-approval" className={getNavLinkClass}>
                  <PackageMinus className="h-4 w-4" />
                  <span>Stock Out Approval</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Inventory">
                <NavLink to="/manager/inventory" className={getNavLinkClass}>
                  <PackageSearch className="h-4 w-4" />
                  <span>Inventory Lookup</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Barcode">
                <NavLink to="/manager/barcode" className={getNavLinkClass}>
                  <ScanLine className="h-4 w-4" />
                  <span>Barcode Lookup</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </>
    );
  }

  // Field Operator navigation
  if (role === 'field_operator') {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <NavLink to="/operator" end className={getNavLinkClass}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Field Operations</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="New Stock In">
                <NavLink to="/operator/stock-in" className={getNavLinkClass}>
                  <PackagePlus className="h-4 w-4" />
                  <span>New Stock In</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="New Stock Out">
                <NavLink to="/operator/stock-out" className={getNavLinkClass}>
                  <PackageMinus className="h-4 w-4" />
                  <span>New Stock Out</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="My Submissions">
                <NavLink to="/operator/submissions" className={getNavLinkClass}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>My Submissions</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Barcode Lookup">
                <NavLink to="/operator/barcode-lookup" className={getNavLinkClass}>
                  <ScanLine className="h-4 w-4" />
                  <span>Barcode Lookup</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </>
    );
  }

  // Sales Operator navigation
  if (role === 'sales_operator') {
    return (
      <>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Dashboard">
                <NavLink to="/sales" end className={getNavLinkClass}>
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Sales Operations</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Customer Inquiries">
                <NavLink to="/sales/inquiries" className={getNavLinkClass}>
                  <MessageSquare className="h-4 w-4" />
                  <span>Customer Inquiries</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Products">
                <NavLink to="/sales/inventory" className={getNavLinkClass}>
                  <PackageSearch className="h-4 w-4" />
                  <span>Product Catalog</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </>
    );
  }

  // Default/fallback navigation
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Dashboard">
            <NavLink to="/" end className={getNavLinkClass}>
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default MainLayout;
