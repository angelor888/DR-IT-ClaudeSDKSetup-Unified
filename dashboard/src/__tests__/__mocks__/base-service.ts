// Mock BaseService for testing

export abstract class BaseService {
  protected readonly name: string;
  protected readonly log: any = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  };

  constructor(options: any) {
    this.name = options.name;
  }

  protected async get(path: string, config?: any): Promise<any> {
    throw new Error('get not mocked');
  }

  protected async post(path: string, data?: any, config?: any): Promise<any> {
    throw new Error('post not mocked');
  }

  protected async put(path: string, data?: any, config?: any): Promise<any> {
    throw new Error('put not mocked');
  }

  protected async delete(path: string, config?: any): Promise<any> {
    throw new Error('delete not mocked');
  }

  protected async request(config: any): Promise<any> {
    throw new Error('request not mocked');
  }

  async checkHealth(): Promise<any> {
    return { status: 'healthy' };
  }

  destroy(): void {
    // noop
  }
}
