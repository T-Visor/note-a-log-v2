export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO 18601
  updatedAt: string; // ISO 18601
}

export type Theme = "system" | "dark" | "light";