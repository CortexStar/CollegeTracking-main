import React, { useCallback, memo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Editable, EditableSpan } from "@/components/ui/inline-edit";
import { Semester } from "@/utils/parseCourseData";
import { Draggable } from "@hello-pangea/dnd";
import CourseTable from "./CourseTable";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { motion, AnimatePresence } from "framer-motion";

export interface SemesterDropdownProps {
  semester: Semester;
  index: number;
  editing: {
    semesterId: string;
    courseIndex: number;
    field: "id" | "title" | "grade" | "credits";
    value: string;
  } | null;
  editingSemesterId: string | null;
  editedSemesterName: string;
  onStartEditingSemesterName: (id: string, currentName: string) => void;
  onSaveEditedSemesterName: (newName?: string) => void;
  onStartEditingCourse: (
    semesterId: string,
    courseIndex: number,
    field: "id" | "title" | "grade" | "credits",
    currentValue: string
  ) => void;
  onSaveEditedCourse: (newValue?: string) => void;
  onRemoveSemester: (id: string) => void;
  onAddCourse: (semesterId: string) => void;
  onRemoveCourse: (semesterId: string, courseIndex: number) => void;
}

/**
 * SemesterDropdown component - displays a semester with dropdown menu for courses
 */
const SemesterDropdown: React.FC<SemesterDropdownProps> = ({
  semester,
  index,
  editing,
  editingSemesterId,
  editedSemesterName,
  onStartEditingSemesterName,
  onSaveEditedSemesterName,
  onStartEditingCourse,
  onSaveEditedCourse,
  onRemoveSemester,
  onAddCourse,
  onRemoveCourse,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleStartEditingSemesterName = useCallback(() => {
    onStartEditingSemesterName(semester.id, semester.name);
  }, [onStartEditingSemesterName, semester.id, semester.name]);

  const handleRemoveSemester = useCallback(() => {
    onRemoveSemester(semester.id);
  }, [onRemoveSemester, semester.id]);

  const handleAddCourse = useCallback(() => {
    onAddCourse(semester.id);
  }, [onAddCourse, semester.id]);

  const toggleDropdown = useCallback(() => {
    // Check if we're at the bottom of the page before opening
    const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;
    
    if (isAtBottom) {
      // If at bottom, add padding to the bottom of the document to prevent scroll up
      const padding = document.createElement('div');
      padding.style.height = '100vh';
      padding.id = 'temp-padding';
      document.body.appendChild(padding);
    }
    
    setIsOpen(prev => !prev);
  }, []);

  // Clean up padding when closing
  useEffect(() => {
    if (!isOpen) {
      const padding = document.getElementById('temp-padding');
      if (padding) {
        padding.remove();
      }
    }
  }, [isOpen]);

  return (
    <Draggable draggableId={semester.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="mb-4"
        >
          <ContextMenu>
            <ContextMenuTrigger>
              <div className="border rounded-md bg-card shadow-sm overflow-hidden">
                {/* Header */}
                <div 
                  className={`flex items-center border-b cursor-pointer transition-colors ${isOpen ? "border-b-primary/20" : ""} hover:bg-accent/50`}
                  onClick={toggleDropdown}
                >
                  <div 
                    className="hidden" 
                    {...provided.dragHandleProps}
                  >
                    {/* Hidden draghandle */}
                  </div>
                  
                  <div className="flex-1 py-4 px-4">
                    <div className="flex flex-row items-center w-full justify-between gap-2">
                      <div 
                        className="font-medium text-base text-left flex-1 flex items-center"
                      >
                        <div 
                          className="w-auto text-muted-foreground" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editingSemesterId !== semester.id) {
                              handleStartEditingSemesterName();
                            }
                          }}
                        >
                          {editingSemesterId === semester.id ? (
                            <EditableSpan
                              value={editedSemesterName}
                              onSave={(newVal) => onSaveEditedSemesterName(newVal)}
                              aria-label="Semester name"
                            />
                          ) : (
                            semester.name
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-sm font-medium px-2 py-1 text-primary">
                          {semester.gpa.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      ref={contentRef}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        duration: 0.2,
                        ease: "easeInOut"
                      }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-t-border/50 bg-card">
                        <CourseTable
                          semesterId={semester.id}
                          courses={semester.courses}
                          editing={editing}
                          onStartEditing={onStartEditingCourse}
                          onSaveEditing={onSaveEditedCourse}
                          onAddCourse={onAddCourse}
                          onRemoveCourse={onRemoveCourse}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={handleAddCourse} className="cursor-pointer">
                Add Course
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={handleRemoveSemester}
                className="text-red-500 cursor-pointer"
              >
                Delete Semester
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}
    </Draggable>
  );
};

export default memo(SemesterDropdown);
