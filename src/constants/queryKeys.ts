// Unified query keys for consistent cache management
export const QueryKeys = {
  // Inventory related
  INVENTORY: 'inventory',
  INVENTORY_ITEMS: 'inventory-items',
  INVENTORY_ITEM: (id: string) => ['inventory-item', id],
  
  // Batch operations
  BATCH_OPERATIONS: 'batch-operations',
  BATCH_OPERATION: (id: string) => ['batch-operation', id],
  
  // Stock movements
  STOCK_MOVEMENTS: 'stock-movements',
  
  // Recent activity
  RECENT_ACTIVITY: 'recent-activity',
  
  // Products
  PRODUCTS: 'products',
  PRODUCT: (id: string) => ['product', id],
  
  // Warehouses
  WAREHOUSES: 'warehouses',
  WAREHOUSE: (id: string) => ['warehouse', id],
  
  // Warehouse locations
  WAREHOUSE_LOCATIONS: 'warehouse-locations',
  
  // Stock in/out
  STOCK_IN_REQUESTS: 'stock-in-requests',
  STOCK_OUT_REQUESTS: 'stock-out-requests',
  
  // Users
  USERS: 'users',
  USER: (id: string) => ['user', id],
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  UNREAD_NOTIFICATIONS: 'unread-notifications',
  
  // Audit logs
  AUDIT_LOGS: 'audit-logs',
};
