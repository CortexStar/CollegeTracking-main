import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import React, { useRef, useState, ChangeEvent, DragEvent, useEffect } from 'react';
import { useLocation } from 'wouter'; // For navigation
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"; // Added import

// Updated ExamEntry interface
interface ExamEntry {
  id: string;
  classCode?: string;    // e.g., FIN3403
  classTitle: string;   // e.g., Business Finance
  examName: string;
  examNumber?: number | null; // null for Final, undefined if not numbered
  examDate: string;     // YYYY-MM-DD
  source: 'pdf' | 'manual';
}

export default function ExamsNewPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [, navigate] = useLocation(); // For navigation

  // State for manual inputs
  const [manualClassTitle, setManualClassTitle] = useState('');
  const [manualClassCode, setManualClassCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New state for managing multiple exam entries for a single class
  const [currentExamNameInput, setCurrentExamNameInput] = useState('');
  const [currentExamDateInput, setCurrentExamDateInput] = useState('');
  const [pendingManualExams, setPendingManualExams] = useState<{ id: string; examName: string; examDate: string }[]>([]);
  const [showExamEntryForm, setShowExamEntryForm] = useState(false);

  const MAX_FILES = 5;

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00'); // Ensure date is parsed as local not UTC
      if (isNaN(date.getTime())) return dateString;
      // const day = date.getDate();
      // let suffix = 'th';
      // if (day === 1 || day === 21 || day === 31) suffix = 'st';
      // else if (day === 2 || day === 22) suffix = 'nd';
      // else if (day === 3 || day === 23) suffix = 'rd';
      // return `${date.toLocaleString('default', { month: 'long' })} ${day}${suffix}`;
      return date.toLocaleString('default', { month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const processFiles = (newFilesArray: File[]) => {
    setUploadError('');
    const pdfFiles = newFilesArray.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length !== newFilesArray.length) {
      setUploadError('Please upload PDF files only. (Note: PDF parsing is currently disabled)');
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFiles(prevFiles => {
      const combinedFiles = [...prevFiles];
      pdfFiles.forEach(newFile => {
        if (!prevFiles.some(existingFile => existingFile.name === newFile.name)) {
          combinedFiles.push(newFile);
        }
      });
      if (combinedFiles.length > MAX_FILES) {
        setUploadError(`You can upload a maximum of ${MAX_FILES} PDF files. (Note: PDF parsing is currently disabled)`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return prevFiles;
      }
      return combinedFiles;
    });
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    if (selectedFiles.length === 1 && fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); if (!isDragging) setIsDragging(true); };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault(); event.stopPropagation(); setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) processFiles(Array.from(files));
  };

  const handleAddExamDetailToList = () => {
    if (!currentExamNameInput.trim() || !currentExamDateInput.trim()) {
      return;
    }
    setPendingManualExams(prev => [...prev, { id: uuidv4(), examName: currentExamNameInput, examDate: currentExamDateInput }]);
    setCurrentExamNameInput('');
    setCurrentExamDateInput('');
  };

  const handleRemovePendingExam = (idToRemove: string) => {
    setPendingManualExams(prev => prev.filter(exam => exam.id !== idToRemove));
  };

  const handleSaveExams = async () => {
    setIsSaving(true);
    setUploadError('');

    if (!manualClassTitle.trim() || pendingManualExams.length === 0) {
      setIsSaving(false);
      return;
    }

    setUploadError('');
    const allParsedExams: ExamEntry[] = [];

    if (selectedFiles.length > 0) {
        setUploadError("PDF processing is currently disabled. Only manually added exams will be saved.");
    }

    // Process pendingManualExams
    if (manualClassTitle.trim() && pendingManualExams.length > 0) {
      pendingManualExams.forEach(pendingExam => {
        allParsedExams.push({
          id: uuidv4(), // Final ID for storage
          classCode: manualClassCode.trim() || undefined,
          classTitle: manualClassTitle.trim(),
          examName: pendingExam.examName.trim(),
          examDate: pendingExam.examDate.trim(),
          source: 'manual'
        });
      });
    } else if (manualClassTitle.trim() && (currentExamNameInput.trim() || currentExamDateInput.trim()) && pendingManualExams.length === 0) {
        setUploadError("Please add exam details to the list before saving, or clear class information if not adding manual exams.");
        setIsSaving(false);
        return;
    }

    if (allParsedExams.length === 0) {
        if (selectedFiles.length > 0 && !manualClassTitle.trim()) {
            setUploadError("PDF processing is disabled. Please add exam information manually or clear selected files.");
        } else if (!manualClassTitle.trim() && pendingManualExams.length === 0 && !currentExamNameInput.trim() && !currentExamDateInput.trim()) {
            setUploadError("No manual exam data entered. Please add exam information.");
        } else if (manualClassTitle.trim() && pendingManualExams.length === 0 && !currentExamNameInput.trim() && !currentExamDateInput.trim()) {
            setUploadError("No exams listed for the current class. Please add exam details.");
        }
        setIsSaving(false);
        return;
    }
    
    // Get existing exams from localStorage
    const existingExamsJson = localStorage.getItem('parsedExamsData');
    const existingExams: ExamEntry[] = existingExamsJson ? JSON.parse(existingExamsJson) : [];
    
    // Combine existing and new exams
    const updatedExams = [...existingExams, ...allParsedExams];
    
    // Save to localStorage
    localStorage.setItem('parsedExamsData', JSON.stringify(updatedExams));
    
    // Clear inputs after successful save
    setManualClassTitle('');
    setManualClassCode('');
    setPendingManualExams([]);
    setCurrentExamNameInput('');
    setCurrentExamDateInput('');
    setShowExamEntryForm(false);

    setIsSaving(false);
    navigate('/exams');
  };

  return (
    <div className="container mx-auto px-4 py-6 flex-grow">
      <h1 className="text-3xl font-bold mb-6">Add/Upload Exams</h1>
      <Card className="mb-8 border-0 shadow-none">
        <CardHeader>
          <CardTitle className="border-b-2 border-black pb-2">Syllabus Upload</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-4">
          <div
            className={`w-full h-40 flex flex-col items-center justify-center gap-2 border-2 border-dashed dark:border-gray-700 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            {isDragging ? 'Drop PDF files here...' : 'Click or Drag & Drop to Upload Syllabuses'}
          </div>
          <input type="file" ref={fileInputRef} multiple accept=".pdf,application/pdf" hidden onChange={handleFileSelect} style={{ display: 'none' }} />

          {uploadError && (<p className="text-sm text-red-500 mt-2">{uploadError}</p>)}

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2 border-t pt-4">
              <h4 className="text-md font-medium">Selected Files ({selectedFiles.length}/{MAX_FILES}):</h4>
              <ul className="list-disc list-inside pl-4 space-y-1">
                {selectedFiles.map(file => (
                  <li key={file.name} className="text-sm flex justify-between items-center group">
                    <span className="truncate pr-2">{file.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(file.name)} className="text-red-500 hover:text-red-700 opacity-50 group-hover:opacity-100">Remove</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <CardTitle className="pt-4 mt-2 flex justify-between items-center border-b-2 border-black pb-2">
            <span>Manually Add Exam</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!manualClassTitle.trim()) {
                  return;
                }
                setShowExamEntryForm(prev => !prev);
              }}
              className="bg-white border-white hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-800 dark:hover:bg-gray-700"
            >
              {showExamEntryForm ? 'Cancel Exam' : 'Add Exam'}
            </Button>
          </CardTitle>

          {true && ( 
            <>
              <div className="grid gap-4 mb-4"> {/* Added mb-4 for spacing */}
                <div className="grid gap-2">
                  <label htmlFor="classCodeManual" className="text-sm font-medium">Class Code (Optional)</label>
                  <Input id="classCodeManual" placeholder="" value={manualClassCode} onChange={e => setManualClassCode(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="classNameManual" className="text-sm font-medium">Class Title</label>
                  <Input id="classNameManual" placeholder="" value={manualClassTitle} onChange={e => setManualClassTitle(e.target.value)} />
                </div>
              </div>
              
              {/* Conditional Exam Entry Form */}
              {showExamEntryForm && manualClassTitle.trim() && (
                <div className="p-4 border rounded-md bg-muted/40 my-4">
                  <h3 className="text-lg font-semibold mb-3">{manualClassTitle}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="grid gap-2 md:col-span-2">
                      <label htmlFor="currentExamName" className="text-sm font-medium">Exam Name</label>
                      <Input id="currentExamName" placeholder="" value={currentExamNameInput} onChange={e => setCurrentExamNameInput(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="currentExamDate" className="text-sm font-medium">Exam Date</label>
                      <Input id="currentExamDate" type="date" value={currentExamDateInput} onChange={e => setCurrentExamDateInput(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={handleAddExamDetailToList} 
                      size="sm" 
                      variant="outline"
                    >
                      Add Exam
                    </Button>
                  </div>
                </div>
              )}

              {/* List of Pending Manual Exams */}
              {pendingManualExams.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-2">{manualClassTitle || 'Inputted Class Name'}</h4>
                  <ul className="space-y-2">
                    {pendingManualExams.map(exam => (
                      <ContextMenu key={exam.id}>
                        <ContextMenuTrigger asChild>
                          <li 
                            className="flex justify-between items-center p-3 border rounded-md bg-card shadow-sm hover:bg-muted cursor-pointer"
                          >
                            <span className="font-medium truncate mr-4">{exam.examName}</span>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDateForDisplay(exam.examDate)}</span>
                          </li>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="min-w-max"> {/* Adjusted width to content */}
                          <ContextMenuItem 
                            onClick={() => handleRemovePendingExam(exam.id)} 
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive/90 cursor-pointer px-3 py-1.5" /* Ensure padding for size */
                          >
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                onClick={handleSaveExams} 
                className="mt-6 w-full" 
                size="lg" 
                disabled={isSaving} // Only disable while actually saving
              >
                {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Exams...</>) : "Save Exams & View Calendar"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 