import React, { useCallback, memo, useState } from "react";
import {
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Editable, EditableSpan } from "@/components/ui/inline-edit";
import { Semester } from "@/utils/parseCourseData";
import { Draggable } from "@hello-pangea/dnd";
import CourseTable from "./CourseTable";
import { ChevronDown } from "lucide-react";

export interface SemesterAccordionProps {
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
 * SemesterAccordion component - displays a semester with collapsible course table
 */
const SemesterAccordion: React.FC<SemesterAccordionProps> = ({
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
  const [isOpen, setIsOpen] = useState(true);
  
  const handleStartEditingSemesterName = useCallback(() => {
    onStartEditingSemesterName(semester.id, semester.name);
  }, [onStartEditingSemesterName, semester.id, semester.name]);

  const handleRemoveSemester = useCallback(() => {
    onRemoveSemester(semester.id);
  }, [onRemoveSemester, semester.id]);

  const handleAddCourse = useCallback(() => {
    onAddCourse(semester.id);
  }, [onAddCourse, semester.id]);

  return (
    <Draggable draggableId={semester.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="mb-4"
        >
          <div className="border rounded-md bg-card shadow-sm overflow-hidden">
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="w-full"
            >
              <div className="flex items-center border-b">
                <div 
                  className="p-1 cursor-grab" 
                  {...provided.dragHandleProps}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-muted-foreground"
                  >
                    <path
                      d="M5.5 4.625C5.5 5.06 5.14 5.42 4.7 5.42C4.26 5.42 3.9 5.06 3.9 4.625C3.9 4.19 4.26 3.83 4.7 3.83C5.14 3.83 5.5 4.19 5.5 4.625ZM4.7 8.705C5.14 8.705 5.5 8.345 5.5 7.91C5.5 7.475 5.14 7.115 4.7 7.115C4.26 7.115 3.9 7.475 3.9 7.91C3.9 8.345 4.26 8.705 4.7 8.705ZM4.7 11.17C5.14 11.17 5.5 10.81 5.5 10.375C5.5 9.94 5.14 9.58 4.7 9.58C4.26 9.58 3.9 9.94 3.9 10.375C3.9 10.81 4.26 11.17 4.7 11.17ZM11.1 4.625C11.1 5.06 10.74 5.42 10.3 5.42C9.86 5.42 9.5 5.06 9.5 4.625C9.5 4.19 9.86 3.83 10.3 3.83C10.74 3.83 11.1 4.19 11.1 4.625ZM10.3 8.705C10.74 8.705 11.1 8.345 11.1 7.91C11.1 7.475 10.74 7.115 10.3 7.115C9.86 7.115 9.5 7.475 9.5 7.91C9.5 8.345 9.86 8.705 10.3 8.705ZM10.3 11.17C10.74 11.17 11.1 10.81 11.1 10.375C11.1 9.94 10.74 9.58 10.3 9.58C9.86 9.58 9.5 9.94 9.5 10.375C9.5 10.81 9.86 11.17 10.3 11.17Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </div>
                <CollapsibleTrigger className="flex-1 hover:no-underline py-4 px-2 flex items-center">
                  <div className="flex flex-col md:flex-row md:items-center w-full justify-between gap-2">
                    <div className="font-medium text-base text-left flex-1 flex items-center">
                      <ChevronDown 
                        className={`mr-2 h-4 w-4 transition-transform ${isOpen ? "transform rotate-180" : ""}`} 
                      />
                      {editingSemesterId === semester.id ? (
                        <EditableSpan
                          value={editedSemesterName}
                          onSave={(newVal) => onSaveEditedSemesterName(newVal)}
                          aria-label="Semester name"
                        />
                      ) : (
                        <Editable
                          onEdit={handleStartEditingSemesterName}
                          aria-label="Edit semester name"
                        >
                          {semester.name}
                        </Editable>
                      )}
                    </div>
                    <div className="space-x-2 flex justify-end text-sm text-muted-foreground">
                      <span className="px-2 py-1 bg-muted rounded">
                        {semester.courses.length} Courses
                      </span>
                      <span className="px-2 py-1 bg-muted rounded">
                        {semester.totalCredits} Credits
                      </span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                        GPA: {semester.gpa.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="px-4 py-4">
                <CourseTable
                  semesterId={semester.id}
                  courses={semester.courses}
                  editing={editing}
                  onStartEditing={onStartEditingCourse}
                  onSaveEditing={onSaveEditedCourse}
                  onAddCourse={onAddCourse}
                  onRemoveCourse={onRemoveCourse}
                />
                <div className="flex justify-between mt-4">
                  <Button size="sm" variant="outline" onClick={handleAddCourse}>
                    Add Course
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemoveSemester}
                  >
                    Delete Semester
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default memo(SemesterAccordion);