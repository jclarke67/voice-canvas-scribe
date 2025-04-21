
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  onDeletePage
}) => {
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };
  
  return (
    <div className="flex items-center justify-between border-t py-2 px-4">
      <div className="flex items-center space-x-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handlePreviousPage}
          disabled={currentPage === 0}
          className="h-8 w-8 p-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleNextPage}
          disabled={currentPage === totalPages - 1}
          className="h-8 w-8 p-0"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddPage}
          className="h-8 w-8 p-0"
          aria-label="Add page"
          title="Add new page"
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeletePage}
          disabled={totalPages <= 1}
          className="h-8 w-8 p-0"
          aria-label="Delete page"
          title="Delete current page"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PageNavigation;
