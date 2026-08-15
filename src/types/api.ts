export interface Paginated<T> {
  data: T[];
  page: number;
  hasMore: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
