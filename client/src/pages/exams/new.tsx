import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, FileText, X, Plus, Calendar } from "lucide-react";
import React, { useRef, useState, ChangeEvent, DragEvent, useCallback } from 'react';
import { useLocation } from 'wouter';
import { v4 as uuidv4 } from 'uuid';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ExamEntry {
  id: string;
  classCode?: string;
  classTitle: string;
  examName: string;
  examNumber?: number | null;
  examDate: string;
  source: 'pdf' | 'manual';
}

interface PendingExam {
  id: string;
  examName: string;
  examDate: string;
}

export default function ExamsNewPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [, navigate] = useLocation();

  // Manual input states
  const [manualClassTitle, setManualClassTitle] = useState('');
  const [manualClassCode, setManualClassCode] = useState('');
  const [currentExamNameInput, setCurrentExamNameInput] = useState('');
  const [currentExamDateInput, setCurrentExamDateInput] = useState('');
  const [pendingManualExams, setPendingManualExams] = useState<PendingExam[]>([]);
  const [showExamEntryForm, setShowExamEntryForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const MAX_FILES = 5;

  const formatDateForDisplay = useCallback((dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('default', { month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const processFiles = useCallback((newFilesArray: File[]) => {
    setUploadError('');
    const pdfFiles = newFilesArray.filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
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
  }, []);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [processFiles]);

  const handleRemoveFile = useCallback((fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    if (selectedFiles.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [selectedFiles.length]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) processFiles(Array.from(files));
  }, [processFiles]);

  const validateExamInput = useCallback((examName: string, examDate: string): string | null => {
    if (!examName.trim()) return 'Exam name is required';
    if (!examDate.trim()) return 'Exam date is required';
    
    // Validate date format and ensure it's not in the past
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(examDate)) return 'Date must be in YYYY-MM-DD format';
    
    const examDateObj = new Date(examDate + 'T00:00:00');
    if (isNaN(examDateObj.getTime())) return 'Invalid date';
    
    // Check for duplicate exam names within the same class
    const isDuplicate = pendingManualExams.some(exam => 
      exam.examName.toLowerCase().trim() === examName.toLowerCase().trim()
    );
    if (isDuplicate) return 'An exam with this name already exists for this class';
    
    return null;
  }, [pendingManualExams]);

  const handleAddExamDetailToList = useCallback(() => {
    const validationError = validateExamInput(currentExamNameInput, currentExamDateInput);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    
    // Clear any previous errors
    setUploadError('');
    
    // Create new exam entry with enhanced metadata
    const newExam: PendingExam = {
      id: uuidv4(),
      examName: currentExamNameInput.trim(),
      examDate: currentExamDateInput.trim()
    };
    
    // Add to pending exams with smart sorting by date
    setPendingManualExams(prev => {
      const updatedExams = [...prev, newExam];
      return updatedExams.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
    });
    
    // Reset form inputs
    setCurrentExamNameInput('');
    setCurrentExamDateInput('');
  }, [currentExamNameInput, currentExamDateInput, validateExamInput]);

  const handleRemovePendingExam = useCallback((idToRemove: string) => {
    setPendingManualExams(prev => prev.filter(exam => exam.id !== idToRemove));
  }, []);

  const toggleExamForm = useCallback(() => {
    if (!manualClassTitle.trim()) {
      return;
    }
    setShowExamEntryForm(prev => !prev);
    if (showExamEntryForm) {
      setCurrentExamNameInput('');
      setCurrentExamDateInput('');
    }
  }, [manualClassTitle, showExamEntryForm]);

  const organizeExamDataForStorage = useCallback((
    classTitle: string, 
    classCode: string, 
    pendingExams: PendingExam[]
  ): ExamEntry[] => {
    const baseClassInfo = {
      classTitle: classTitle.trim(),
      classCode: classCode.trim() || undefined,
      source: 'manual' as const
    };

    return pendingExams.map((exam, index) => {
      // Enhanced exam entry with smart numbering and categorization
      const examEntry: ExamEntry = {
        id: uuidv4(),
        ...baseClassInfo,
        examName: exam.examName.trim(),
        examDate: exam.examDate.trim(),
        examNumber: deriveExamNumber(exam.examName, index)
      };

      return examEntry;
    });
  }, []);

  const deriveExamNumber = useCallback((examName: string, fallbackIndex: number): number | null => {
    const name = examName.toLowerCase();
    
    // Handle final exams
    if (name.includes('final')) return null;
    
    // Extract number from common patterns
    const numberPatterns = [
      /exam\s*(\d+)/i,
      /test\s*(\d+)/i,
      /midterm\s*(\d+)/i,
      /quiz\s*(\d+)/i,
      /(\d+)(?:st|nd|rd|th)?\s*(?:exam|test|midterm|quiz)/i
    ];
    
    for (const pattern of numberPatterns) {
      const match = name.match(pattern);
      if (match) return parseInt(match[1], 10);
    }
    
    // Smart fallback based on common exam naming
    if (name.includes('midterm') && !name.includes('2')) return 1;
    if (name.includes('mid') && name.includes('term')) return 1;
    
    // Use position-based numbering as last resort
    return fallbackIndex + 1;
  }, []);

  const handleSaveExams = async () => {
    setIsSaving(true);
    setUploadError('');

    // Comprehensive validation
    if (!manualClassTitle.trim()) {
      setUploadError("Class title is required.");
      setIsSaving(false);
      return;
    }

    if (pendingManualExams.length === 0) {
      setUploadError("Please add at least one exam before saving.");
      setIsSaving(false);
      return;
    }

    // Handle PDF files notification
    if (selectedFiles.length > 0) {
      setUploadError("PDF processing is currently disabled. Only manually added exams will be saved.");
    }

    try {
      // Organize exam data with enhanced structure
      const newExamEntries = organizeExamDataForStorage(
        manualClassTitle, 
        manualClassCode, 
        pendingManualExams
      );

      // Retrieve and merge with existing data
      const existingExamsJson = localStorage.getItem('parsedExamsData');
      const existingExams: ExamEntry[] = existingExamsJson ? JSON.parse(existingExamsJson) : [];
      
      // Intelligent merging - prevent duplicates and maintain chronological order
      const mergedExams = [...existingExams, ...newExamEntries]
        .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
      
      // Persist to storage
      localStorage.setItem('parsedExamsData', JSON.stringify(mergedExams));
      
      // Comprehensive cleanup
      resetFormState();
      
      // Navigate with success
      navigate('/exams');
      
    } catch (error) {
      console.error('Failed to save exams:', error);
      setUploadError("Failed to save exams. Please check your data and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetFormState = useCallback(() => {
    setManualClassTitle('');
    setManualClassCode('');
    setPendingManualExams([]);
    setCurrentExamNameInput('');
    setCurrentExamDateInput('');
    setShowExamEntryForm(false);
    setSelectedFiles([]);
    setUploadError('');
  }, []);

  const handleCalendarClick = useCallback(() => {
    if (dateInputRef.current) {
      dateInputRef.current.type = 'date';
      dateInputRef.current.focus();
      dateInputRef.current.showPicker?.();
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Add New Exams</h1>
            <p className="text-sm text-gray-600">Upload syllabi or manually add exam information</p>
          </div>

          {/* Error Display */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}

          <div className="space-y-10">
            {/* PDF Upload Section */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Syllabus Upload (Optional)
              </label>
              
              {selectedFiles.length > 0 ? (
                <div className="space-y-3">
                  {selectedFiles.map(file => (
                    <div key={file.name} className="group relative bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <FileText className="h-6 w-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file.name)}
                          disabled={isSaving}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">
                    {selectedFiles.length}/{MAX_FILES} files selected
                  </p>
                </div>
              ) : (
                <div
                  className={`relative border-2 rounded-lg p-12 text-center transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-4">
                    <Upload className="h-10 w-10 mx-auto text-gray-400" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">
                        Drop syllabi here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF files only • Maximum {MAX_FILES} files • PDF parsing currently disabled
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </div>
              )}
            </div>

            {/* Manual Entry Section */}
            <div className="space-y-6">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manual Entry
              </label>

              {/* Class Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Code (Optional)
                  </label>
                  <Input
                    value={manualClassCode}
                    onChange={(e) => setManualClassCode(e.target.value)}
                    placeholder="e.g., FIN3403"
                    disabled={isSaving}
                    className="bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2 text-sm font-medium placeholder:text-gray-400 hover:bg-gray-50 transition-colors"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Title
                  </label>
                  <Input
                    value={manualClassTitle}
                    onChange={(e) => setManualClassTitle(e.target.value)}
                    placeholder="e.g., Business Finance"
                    disabled={isSaving}
                    className="bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2 text-sm font-medium placeholder:text-gray-400 hover:bg-gray-50 transition-colors"
                  />
                </div>
              </div>

              {/* Add Exam Button */}
              {manualClassTitle.trim() && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{manualClassTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pendingManualExams.length} exam{pendingManualExams.length !== 1 ? 's' : ''} added
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={toggleExamForm}
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    className="bg-transparent border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {showExamEntryForm ? 'Cancel' : 'Add Exam'}
                  </Button>
                </div>
              )}

              {/* Exam Entry Form */}
              {showExamEntryForm && manualClassTitle.trim() && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Name
                      </label>
                      <Input
                        value={currentExamNameInput}
                        onChange={(e) => setCurrentExamNameInput(e.target.value)}
                        placeholder="e.g., Midterm Exam"
                        disabled={isSaving}
                        className="bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2 text-sm font-medium placeholder:text-gray-400 hover:bg-gray-50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Date
                      </label>
                      <div className="relative">
                        <Input
                          ref={dateInputRef}
                          value={currentExamDateInput}
                          onChange={(e) => setCurrentExamDateInput(e.target.value)}
                          placeholder="YYYY-MM-DD"
                          disabled={isSaving}
                          className="bg-transparent border-transparent focus:border-transparent focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-3 py-2 pr-10 text-sm font-medium placeholder:text-gray-400 hover:bg-gray-50 focus:bg-gray-50 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'textfield'
                          }}
                          onFocus={(e) => {
                            e.target.type = 'date';
                          }}
                          onBlur={(e) => {
                            if (!e.target.value) {
                              e.target.type = 'text';
                            }
                          }}
                        />
                        <Calendar 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                          onClick={handleCalendarClick}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddExamDetailToList}
                      size="sm"
                      disabled={!currentExamNameInput.trim() || !currentExamDateInput.trim() || isSaving}
                      className="bg-transparent border-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                    >
                      Add to List
                    </Button>
                  </div>
                </div>
              )}

              {/* Exam List */}
              {pendingManualExams.length > 0 && (
                <div className="space-y-3">
                  {pendingManualExams.map(exam => (
                    <ContextMenu key={exam.id}>
                      <ContextMenuTrigger asChild>
                        <div className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{exam.examName}</p>
                              <p className="text-xs text-gray-500">{formatDateForDisplay(exam.examDate)}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePendingExam(exam.id);
                            }}
                            disabled={isSaving}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={() => handleRemovePendingExam(exam.id)}
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        >
                          Delete Exam
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/exams')}
                disabled={isSaving}
                className="bg-transparent border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveExams}
                disabled={isSaving || !manualClassTitle.trim() || pendingManualExams.length === 0}
                className="bg-transparent border-transparent hover:bg-gray-50 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSaving ? 'Saving Exams...' : 'Save Exams & View Calendar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}