import { Book } from "../../shared/schema";

export interface BookUploadSuccess {
  success: true;
  data: Book;
}

export interface BookUploadError {
  success: false;
  message: string;
} 