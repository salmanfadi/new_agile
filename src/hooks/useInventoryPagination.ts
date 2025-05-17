
import { useState } from 'react';
import { InventoryItem } from '@/hooks/useInventoryData';

interface UseInventoryPaginationProps {
  items: InventoryItem[];
  initialPage?: number;
  initialPageSize?: number;
}

interface UseInventoryPaginationResult {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  paginatedItems: InventoryItem[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

export const useInventoryPagination = ({
  items,
  initialPage = 1,
  initialPageSize = 20
}: UseInventoryPaginationProps): UseInventoryPaginationResult => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };
  
  // Ensure current page is valid
  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(validPage);
  };
  
  // Create paginated subset of items
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange
  };
};
