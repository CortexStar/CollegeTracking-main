/**
 * Helper functions for showing toast notifications
 */
interface ToastHelperProps {
  toast: {
    (props: {
      title: string;
      description?: string;
      variant?: "default" | "destructive" | null;
    }): void;
  };
}

/**
 * Create a set of toast helper functions
 * @param props Object containing the toast function
 * @returns Object with helper methods for different toast types
 */
export function createToastHelpers({ toast }: ToastHelperProps) {
  /**
   * Show a success toast notification
   * @param message Success message
   * @param description Optional description
   */
  const toastSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description: description,
      variant: "default",
    });
  };

  /**
   * Show an error toast notification
   * @param message Error message
   * @param description Optional description
   */
  const toastError = (message: string, description?: string) => {
    toast({
      title: message,
      description: description,
      variant: "destructive",
    });
  };

  /**
   * Show an informational toast notification
   * @param message Info message
   * @param description Optional description
   */
  const toastInfo = (message: string, description?: string) => {
    toast({
      title: message,
      description: description,
    });
  };

  return {
    toastSuccess,
    toastError,
    toastInfo,
  };
}