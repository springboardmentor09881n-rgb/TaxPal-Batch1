export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T;

  constructor(data: T, message: string = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}
