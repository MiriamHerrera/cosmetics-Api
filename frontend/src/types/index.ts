// Tipos básicos para Cosmetics App

export interface Product {
  id: number;  // Changed from string to number since database returns numeric IDs
  name: string;
  description: string;
  price: number;
  stock_total: number;
  category_name: string;
  product_type_name: string;
  image_url: string;
  video_url?: string;  // Campo opcional para URL del video
  status: string;
  is_approved?: boolean;  // Campo para aprobación de productos
  created_at: string;
  updated_at: string;
}

// Tipo específico para productos en el AdminPanel
export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  stock_total: number;
  status: string;
  image_url: string | null;
  video_url?: string | null;  // Campo opcional para URL del video
  created_at: string;
  updated_at: string;
  product_type: string;
  category: string;
  is_approved?: boolean;
}

export interface User {
  id: number;  // Changed from string to number
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
}

export interface CartItem {
  productId: number;  // Changed from string to number
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'active' | 'reserved' | 'completed';
  reservedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;  // Changed from string to number
  userId: number;  // Changed from string to number
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  shippingAddress: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;  // Changed from string to number
  name: string;
  description: string;
  image: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Tipos para encuestas
export interface Survey {
  id: number;
  question: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
  options?: SurveyOption[];
  total_votes?: number;
  user_vote?: number; // Para compatibilidad con versiones anteriores
  user_votes?: number[]; // Array de IDs de opciones votadas por el usuario
  options_count?: number;
}

export interface SurveyOption {
  id: number;
  survey_id: number;
  option_text: string;
  description?: string;
  created_by: number;
  is_approved: boolean;
  admin_notes?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  votes?: number;
  suggested_by?: string;
  // Campos adicionales para opciones pendientes de aprobación
  survey_question?: string;
  // Campo para estado de la opción (approved/pending)
  status?: 'approved' | 'pending';
}

export interface SurveyVote {
  id: number;
  survey_id: number;
  option_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}
