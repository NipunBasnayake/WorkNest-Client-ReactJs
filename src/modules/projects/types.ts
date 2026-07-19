import type { UploadedFileAsset } from "@/types";

export type ProjectStatus = "planned" | "active" | "on_hold" | "completed" | "cancelled";

export interface ProjectOwner {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  progress: number;
  teamIds: string[];
  teamCount?: number;
  createdBy?: ProjectOwner;
  documents: UploadedFileAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormValues {
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  teamIds: string[];
  documents: UploadedFileAsset[];
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>;
