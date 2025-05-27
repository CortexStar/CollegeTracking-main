import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Worker source (essential for pdfjs-dist)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

interface TocItem {
  title: string;
  dest: any; // Destination can be complex, store it for navigation
  level: number; // Keep track of nesting level, assuming 1-based for simplicity
  items: TocItem[]; // pdfjs-dist uses 'items' for children
}

interface TextbookTocProps {
  pdfUrl: string | null; // pdfUrl can be null
}

export function TextbookToc({ pdfUrl }: TextbookTocProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfUrl) {
      setTocItems([]);
      setLoading(false);
      setError('PDF URL not available.');
      return;
    }

    const fetchToc = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const outline = await pdf.getOutline();
        
        if (outline && outline.length > 0) {
          // Simple transformation, assuming a basic structure. 
          // Real outlines can be more complex (e.g. various dest types).
          // For this example, we'll map it directly. Level can be inferred or added.
          const transformOutline = (items: any[], level = 1): TocItem[] => {
            return items.map(item => ({
              title: item.title,
              dest: item.dest, // Store the original destination
              level: level,
              items: item.items ? transformOutline(item.items, level + 1) : []
            }));
          };
          setTocItems(transformOutline(outline));
        } else {
          setTocItems([]);
          // setError('No table of contents found in this PDF.'); // User prefers subtle message
        }
      } catch (e) {
        console.error('Error loading or parsing PDF for TOC:', e);
        setError('Could not load Table of Contents.');
        setTocItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchToc();
  }, [pdfUrl]);

  const toggleExpanded = (itemKey: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: TocItem) => {
    // TODO: Implement navigation within the PDF viewer using item.dest
    // This requires the PDF viewer component to expose an API for page navigation.
    // For <embed>, this is not directly possible. A more integrated PDF viewer (like react-pdf) would be needed.
    console.log('Navigate to TOC item:', item.title, 'Destination:', item.dest);
  };

  const renderTocItem = (item: TocItem, index: number, parentKey = '') => {
    const itemKey = `${parentKey}-${item.title.replace(/\s+/g, '_')}-${index}`;
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedItems.has(itemKey);

    return (
      <div key={itemKey} className="space-y-1">
        <div
          className={`flex items-center gap-1 p-1.5 rounded hover:bg-muted cursor-pointer group ${
            item.level > 1 ? `ml-${(item.level - 1) * 3}` : '' // Indentation based on level
          }`}
          onClick={() => handleItemClick(item)}
        >
          {hasChildren && (
            <Button
              size="icon-xs" // Smaller button for expand/collapse
              variant="ghost"
              className="h-5 w-5 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(itemKey);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-5 shrink-0" />} {/* Placeholder for alignment */}
          
          <span 
            className={`flex-1 text-sm truncate ${
              item.level === 1 ? 'font-medium' : 'text-muted-foreground'
            } group-hover:text-primary transition-colors`}
            title={item.title} // Show full title on hover
          >
            {item.title}
          </span>
          
          {/* Page numbers are not directly available in pdf.js outline items in a simple way.
              The 'dest' property needs to be resolved to a page number asynchronously.
              For simplicity, we omit page numbers here. 
          <span className="text-xs text-muted-foreground">
            {item.page} 
          </span>
          */}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1 pl-2 border-l border-muted/50 ml-2.5">
            {item.items.map((child, childIndex) =>
              renderTocItem(child, childIndex, itemKey)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <List className="h-4 w-4" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm max-h-96 overflow-y-auto pr-1">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading TOC...</span>
          </div>
        )}
        {!loading && error && (
          <p className="text-muted-foreground text-center py-4">{error}</p>
        )}
        {!loading && !error && tocItems.length === 0 && (
          <p className="text-muted-foreground text-center py-4 italic">
            Table of contents not available in this PDF.
          </p>
        )}
        {!loading && !error && tocItems.length > 0 && (
          tocItems.map((item, index) => renderTocItem(item, index))
        )}
      </CardContent>
    </Card>
  );
} 