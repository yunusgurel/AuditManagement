import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'team';
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type FormTemplate = {
  id: string;
  name: string;
  template_type: string;
  content: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: string[];
  created_by?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
};

export type Audit = {
  id: string;
  client_id?: string;
  task_id?: string;
  form_template_id?: string;
  status: 'draft' | 'in_progress' | 'completed';
  form_data: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: string;
  client_id?: string;
  name: string;
  folder_type: 'meeting_notes' | 'working_papers' | 'contracts' | 'evidence';
  parent_id?: string;
  created_by?: string;
  created_at: string;
};

export type Document = {
  id: string;
  folder_id?: string;
  client_id?: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by?: string;
  created_at: string;
};

export type Checklist = {
  id: string;
  client_id?: string;
  title: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  checklist_id: string;
  description: string;
  is_checked: boolean;
  checked_by?: string;
  checked_at?: string;
  order_index: number;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
  created_at: string;
};
