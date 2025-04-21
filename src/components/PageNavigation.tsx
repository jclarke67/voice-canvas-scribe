
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Trash2, MoveVertical } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onReorderPages?: (fromIndex: number, toIndex: number) => void;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  onDeletePage,
  onReorderPages
}) => {
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  
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
  
  const handleReorderClick = () => {
    setSelectedPageIndex(currentPage);
    setShowReorderDialog(true);
  };
  
  const handleMovePageTo = (targetIndex: number) => {
    if (onReorderPages && selectedPageIndex !== null && targetIndex !== selectedPageIndex) {
      onReorderPages(selectedPageIndex, targetIndex);
    }
    setShowReorderDialog(false);
  };
  
  return (
    <>
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
          {onReorderPages && totalPages > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReorderClick}
              className="h-8 w-8 p-0"
              aria-label="Reorder pages"
              title="Reorder pages"
            >
              <MoveVertical className="h-4 w-4" />
            </Button>
          )}
          
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
      
      <Dialog open={showReorderDialog} onOpenChange={setShowReorderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reorder Pages</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm mb-4">
              Move page {selectedPageIndex !== null ? selectedPageIndex + 1 : ''} to position:
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <Button
                  key={index}
                  variant={selectedPageIndex === index ? "secondary" : "outline"}
                  onClick={() => handleMovePageTo(index)}
                  disabled={selectedPageIndex === index}
                  className="w-full"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReorderDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PageNavigation;
