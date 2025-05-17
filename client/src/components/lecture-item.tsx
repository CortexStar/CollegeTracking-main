import { useState, useEffect } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLectureLinksContext } from "./lecture-links-provider";

interface LectureItemProps {
  problemSetId: string;
  number: string;
  title: string;
}

export default function LectureItem({ problemSetId, number, title }: LectureItemProps) {
  const { getLectureLink, addLectureLink, removeLectureLink } = useLectureLinksContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const lectureLink = getLectureLink(problemSetId, number);
  const [url, setUrl] = useState("");
  
  // Update URL field when dialog opens
  useEffect(() => {
    if (isDialogOpen && lectureLink) {
      setUrl(lectureLink.url);
    } else if (isDialogOpen) {
      setUrl("");
    }
  }, [isDialogOpen, lectureLink]);
  
  const handleAddLink = () => {
    if (url) {
      // Ensure URL has http/https protocol
      let formattedUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        formattedUrl = 'https://' + url;
      }
      
      addLectureLink({
        problemSetId,
        lectureNumber: number,
        url: formattedUrl
      });
      
      setIsDialogOpen(false);
    }
  };
  
  const handleClick = () => {
    if (lectureLink) {
      window.open(lectureLink.url, '_blank');
    }
  };
  
  // Determine styling based on whether this lecture has a link
  const linkStyles = lectureLink 
    ? "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline" 
    : "";
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className={`text-base ${linkStyles}`} onClick={handleClick}>
          <span className="font-medium">Lecture {number}:</span> {title}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {lectureLink ? (
          <>
            <ContextMenuItem onClick={() => setIsDialogOpen(true)}>
              Change Link
            </ContextMenuItem>
            <ContextMenuItem onClick={() => window.open(lectureLink.url, '_blank')}>
              Open Link in New Tab
            </ContextMenuItem>
            <ContextMenuItem onClick={() => removeLectureLink(problemSetId, number)}>
              Remove Link
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem onClick={() => setIsDialogOpen(true)}>
            Add Link to Lecture
          </ContextMenuItem>
        )}
      </ContextMenuContent>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {lectureLink ? "Update Lecture Link" : "Add Lecture Link"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">URL for Lecture {number}</Label>
              <Input
                id="url"
                placeholder="https://example.com/lecture"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="submit" 
              onClick={handleAddLink}
              disabled={!url}
            >
              {lectureLink ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  );
}