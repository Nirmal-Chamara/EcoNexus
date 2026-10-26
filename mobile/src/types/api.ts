export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface PaginatedMeta {
  total: number;
  // Current middleware validates but does not replace req.query with parsed values.
  page: number | string;
  limit: number | string;
  totalPages: number;
}
