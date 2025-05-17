/**
 * Query key factory for TanStack Query
 * 
 * This pattern helps with:
 * 1. Type safety for query keys
 * 2. Better cache invalidation
 * 3. Centralized query key management
 * 4. Preventing key drift across components
 * 
 * Usage examples:
 * 
 * // For fetching
 * useQuery({
 *   queryKey: queryKeys.books.all,
 *   queryFn: getBooks
 * })
 * 
 * // For a specific book
 * useQuery({
 *   queryKey: queryKeys.books.detail(bookId),
 *   queryFn: () => getBook(bookId)
 * })
 * 
 * // For invalidation after mutation
 * queryClient.invalidateQueries({ queryKey: queryKeys.books.all })
 */

export const queryKeys = {
  // User related queries
  user: {
    current: ['/api/user'] as const,
    preferences: (userId: string) => ['/api/user', userId, 'preferences'] as const,
  },
  
  // Book related queries
  books: {
    all: ['/api/books'] as const,
    detail: (id: string) => ['/api/books', id] as const,
    content: (id: string) => ['/api/books', id, 'content'] as const,
  },
  
  // Course related queries
  courses: {
    all: ['/api/courses'] as const,
    detail: (id: string) => ['/api/courses', id] as const,
    problems: (courseId: string) => ['/api/courses', courseId, 'problems'] as const,
    problem: (courseId: string, problemId: string) => 
      ['/api/courses', courseId, 'problems', problemId] as const,
  },
  
  // Grade related queries
  grades: {
    all: ['/api/grades'] as const,
    semesters: ['/api/grades/semesters'] as const,
    semester: (semesterId: string) => ['/api/grades/semesters', semesterId] as const,
    course: (semesterId: string, courseId: string) => 
      ['/api/grades/semesters', semesterId, 'courses', courseId] as const,
  },
  
  // AI related queries
  ai: {
    jobs: ['/api/ai/jobs'] as const,
    job: (jobId: string) => ['/api/ai/jobs', jobId] as const,
  },
};