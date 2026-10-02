export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
