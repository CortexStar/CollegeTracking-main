import { useState, useRef } from "react";
import { useCourseName } from "@/hooks/use-course-name";
import { Input } from "@/components/ui/input";
import { Pencil, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CourseNameDisplay() {
  const { courseName, setCourseName } = useCourseName();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(courseName);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setIsEditing(true);
    setEditedName(courseName);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  };

  const saveEditing = () => {
    if (editedName.trim().length === 0) {
      toast({
        title: "Error",
        description: "Course name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setCourseName(editedName.trim());
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Course name updated",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveEditing();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditedName(courseName);
    }
  };

  return (
    <div className="relative group">
      {isEditing ? (
        <div className="flex items-center">
          <Input
            ref={inputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={saveEditing}
            onKeyDown={handleKeyDown}
            className="text-4xl font-bold h-auto py-2 mb-4 text-gray-900 dark:text-gray-100 bg-transparent border-0 border-b-2 rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 caret-current"
          />
          <button
            onClick={saveEditing}
            className="ml-2 text-gray-500 hover:text-primary"
            aria-label="Save course name"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center cursor-default">
          {courseName}
          <button
            onClick={startEditing}
            className="ml-3 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Edit course name"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </h1>
      )}
    </div>
  );
}