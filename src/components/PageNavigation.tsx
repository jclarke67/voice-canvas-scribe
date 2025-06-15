
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Trash2, Files } from 'lucide-react'; // Use Files icon for "pages"
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

interface PagePreview {
  id: string;
  content: string;
}
interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onReorderPages?: (fromIndex: number, toIndex: number) => void;
  // New optional prop: getPagePreviews
  getPagePreviews?: () => PagePreview[];
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  onDeletePage,
  onReorderPages,
  getPagePreviews
}) => {
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>(Array.from({ length: totalPages }, (_, i) => i));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Refresh order state when totalPages changes (e.g., after adding/removing page)
  React.useEffect(() => {
    setOrder(Array.from({ length: totalPages }, (_, i) => i));
  }, [totalPages, showReorderDialog]);

  const previews: PagePreview[] =
    typeof getPagePreviews === "function"
      ? getPagePreviews()
      : Array.from({ length: totalPages }, (_, i) => ({ id: String(i), content: `Page ${i + 1}` }));

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
    setOrder(Array.from({ length: totalPages }, (_, i) => i));
    setShowReorderDialog(true);
  };

  // Drag and drop logic
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDrop = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newOrder = [...order];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dragOverIndex, 0, removed);
    setOrder(newOrder);

    // Actually reorder pages if the indexes have changed
    if (onReorderPages) {
      onReorderPages(draggedIndex, dragOverIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setShowReorderDialog(false);
  };

  // Handle manual cancel
  const handleCancelDialog = () => {
    setShowReorderDialog(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Get a text summary for the thumbnail preview (first ~40 characters, no html)
  const getThumbnailText = (content: string) => {
    const text = content.replace(/<[^>]+>/g, '').slice(0, 40);
    return text.length === 40 ? text + "..." : text;
  };

  // Get more for expanded thumbnail (first ~200 characters, no html)
  const getExpandedPreviewText = (content: string) => {
    const text = content.replace(/<[^>]+>/g, '').slice(0, 200);
    return text.length === 200 ? text + "..." : text;
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
              <Files className="h-4 w-4" /> {/* Changed from MoveVertical to Files icon */}
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
        <DialogContent className="sm:max-w-[525px] relative">
          <DialogHeader>
            <DialogTitle>Reorder Pages</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm mb-4">Drag and drop pages to reorder them:</div>
            <div className="flex gap-3 flex-wrap min-h-[95px]">
              {order.map((pageIdx, visualIdx) => (
                <div
                  key={pageIdx}
                  draggable
                  tabIndex={0}
                  onDragStart={() => handleDragStart(visualIdx)}
                  onDragOver={e => {
                    e.preventDefault();
                    handleDragOver(visualIdx);
                  }}
                  onDrop={() => handleDrop()}
                  onMouseEnter={() => setHoveredIndex(visualIdx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`transition-all relative border rounded shadow-sm bg-white dark:bg-muted/60 w-[70px] h-[90px] flex flex-col items-center justify-between px-1 py-1 cursor-move 
                    ${visualIdx === draggedIndex ? 'opacity-40 border-primary' : ''}
                    ${visualIdx === dragOverIndex && draggedIndex !== null && dragOverIndex !== draggedIndex
                      ? 'ring-2 ring-primary'
                      : ''}
                  `}
                  style={{
                    zIndex: visualIdx === hoveredIndex ? 20 : 1,
                  }}
                >
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden text-xs text-center select-none">
                    {/* Thumbnail preview of page content */}
                    {previews[pageIdx]
                      ? getThumbnailText(previews[pageIdx].content) || <span className="opacity-30">Empty</span>
                      : <span className="opacity-30">No Data</span>
                    }
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 mb-0.5">
                    #{pageIdx + 1}
                  </div>
                  {/* Expanded preview shown on hover */}
                  {hoveredIndex === visualIdx && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-[100%] mt-2 min-w-[200px] max-w-xs bg-background border rounded shadow-2xl p-3 z-30 animate-fade-in pointer-events-none select-none opacity-95">
                      <div className="text-xs font-semibold mb-1">
                        Page {pageIdx + 1}
                      </div>
                      <div className="line-clamp-6 text-xs text-muted-foreground">
                        {previews[pageIdx]
                          ? getExpandedPreviewText(previews[pageIdx].content)
                          : "No preview available"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleCancelDialog}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PageNavigation;
