/** Simulated network latency so loading states behave like production. */
export async function mockRequest<T>(data: T, delay = 350): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return data;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
