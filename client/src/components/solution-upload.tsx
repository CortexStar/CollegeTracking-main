import { useState, useRef, useEffect } from "react";
import { FileUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Solution } from "@/hooks/use-solutions";
import { useSolutionsContext } from "@/components/solutions-provider";

interface SolutionUploadProps {
  problemSetId: string;
  sectionId: string;
}

export default function SolutionUpload({ problemSetId, sectionId }: SolutionUploadProps) {
  const { getSolution, addSolution, removeSolution } = useSolutionsContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [solution, setSolution] = useState<Solution | undefined>(
    getSolution(problemSetId, sectionId)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update the solution state when it changes in the hook
  useEffect(() => {
    setSolution(getSolution(problemSetId, sectionId));
  }, [getSolution, problemSetId, sectionId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      // Create a URL for the file (in a real app, this would be an API call)
      const fileUrl = URL.createObjectURL(selectedFile);
      
      const newSolution: Solution = {
        problemSetId,
        sectionId,
        fileName: selectedFile.name,
        fileUrl,
      };
      
      addSolution(newSolution);
      setSolution(newSolution);
      setIsDialogOpen(false);
      setSelectedFile(null);
    }
  };

  const handleDelete = () => {
    removeSolution(problemSetId, sectionId);
    setSolution(undefined);
  };

  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {solution ? (
        <ContextMenu>
          <ContextMenuTrigger>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-2 py-0.5 h-7"
              onClick={() => window.open(solution.fileUrl, '_blank')}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Solution</span>
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40">
            <ContextMenuItem onClick={() => setIsDialogOpen(true)}>
              Change File
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDelete}>
              Remove Solution
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-2 py-0.5 h-7"
          onClick={() => setIsDialogOpen(true)}
        >
          <FileUp className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Solution</span>
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Solution</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div 
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={openFileInput}
            >
              <FileUp className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFile ? selectedFile.name : "Drag files here or click to browse"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
            </div>
            
            {selectedFile && (
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleUploadClick}
              disabled={!selectedFile}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}