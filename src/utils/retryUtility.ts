/**
 * A utility for retrying asynchronous operations with configurable retry logic.
 */

/**
 * Configuration options for the retry function.
 */
interface RetryConfig {
    /** Maximum number of retry attempts */
    maxAttempts: number;
    /** Delay between retry attempts in milliseconds */
    delay: number;
    /** Whether to use exponential backoff for retry delays */
    useExponentialBackoff: boolean;
    /** Maximum delay between retries (used with exponential backoff) */
    maxDelay?: number;
    /** Function to determine if an error is retryable */
    retryableError?: (error: any) => boolean;
  }
  
  /**
   * Default configuration for the retry function.
   */
  const defaultConfig: RetryConfig = {
    maxAttempts: 3,
    delay: 1000,
    useExponentialBackoff: true,
    maxDelay: 30000,
    retryableError: () => true,
  };
  
  /**
   * Retries an asynchronous operation with the specified configuration.
   * 
   * @param operation - The asynchronous operation to retry
   * @param config - Configuration options for retrying
   * @returns A promise that resolves with the result of the operation or rejects if all retries fail
   */
  export async function retry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const fullConfig: RetryConfig = { ...defaultConfig, ...config };
    let lastError: any;
  
    for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === fullConfig.maxAttempts || (fullConfig.retryableError && !fullConfig.retryableError(error))) {
          break;
        }
  
        const delay = fullConfig.useExponentialBackoff
          ? Math.min(fullConfig.delay * Math.pow(2, attempt - 1), fullConfig.maxDelay!)
          : fullConfig.delay;
  
        console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  
    throw lastError;
  }
  
  /**
   * A decorator that can be used to automatically retry a class method.
   * 
   * @param config - Configuration options for retrying
   * @returns A method decorator that applies the retry logic
   */
  export function Retryable(config: Partial<RetryConfig> = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
  
      descriptor.value = function (...args: any[]) {
        return retry(() => originalMethod.apply(this, args), config);
      };
  
      return descriptor;
    };
  }
  
  /**
   * Creates a retryable version of an async function.
   * 
   * @param fn - The async function to make retryable
   * @param config - Configuration options for retrying
   * @returns A new function that will retry the original function according to the config
   */
  export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: Partial<RetryConfig> = {}
  ): T {
    return ((...args: Parameters<T>) => retry(() => fn(...args), config)) as T;
  }