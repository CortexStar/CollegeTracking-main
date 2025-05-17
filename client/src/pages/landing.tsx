import React, { useState, useRef, useEffect, DragEvent } from "react";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { toast } from "@/hooks/use-toast";

export default function Landing() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Function to handle file processing
  const processFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        localStorage.setItem('backgroundImage', event.target.result as string);
        setBackgroundImage(event.target.result as string);
        
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Function to handle image upload from input
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Handle the right-click directly if context menu fails
  const handleContextMenu = (e: React.MouseEvent) => {
    // This is a fallback that will activate if the ContextMenu doesn't
    // e.preventDefault();
    // fileInputRef.current?.click();
  };

  // Load saved image on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem('backgroundImage');
    if (savedImage) {
      setBackgroundImage(savedImage);
    }
  }, []);

  return (
    <div className="w-full h-[calc(100vh-32px)] flex flex-col overflow-hidden">
      <div className="w-full h-full flex items-center justify-center">
        <ContextMenu>
          <ContextMenuTrigger className="w-full h-full flex items-center justify-center">
            <div
              className="w-full h-full flex items-center justify-center"
              style={
                backgroundImage
                  ? {
                      backgroundImage: `url(${backgroundImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}
              }
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !backgroundImage && fileInputRef.current?.click()}
              onContextMenu={handleContextMenu}
            >
              {!backgroundImage && (
                <div
                  ref={dropZoneRef}
                  className={`w-3/4 max-w-md h-56 border-2 border-dashed rounded-lg
                    ${isDragging
                      ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-700"}
                    flex flex-col items-center justify-center cursor-pointer`}
                >
                  {/* icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-3"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2 1.6-1.6a2 2 0 012.8 0L20 14M12 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    Click or drag an image here
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Right-click anywhere to upload
                  </p>
                </div>
              )}

              {/* hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </ContextMenuTrigger>

          {/* right‑click menu */}
          <ContextMenuContent>
            <ContextMenuItem onSelect={() => fileInputRef.current?.click()}>
              Upload image
            </ContextMenuItem>
            {backgroundImage && (
              <ContextMenuItem
                onSelect={() => {
                  setBackgroundImage(null);
                  localStorage.removeItem("backgroundImage");
                  toast({ title: "Success", description: "Image removed" });
                }}
              >
                Remove image
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
}