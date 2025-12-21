import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CommonResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  path?: string;
  timestamp: string;
  // Optional metadata container for pagination or additional info
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T = unknown>
  implements NestInterceptor<T, CommonResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<CommonResponse<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest();

    return next.handle().pipe(
      map((body: any): CommonResponse<T> => {
        // Allow controllers/services to set a message or meta via return shape
        // Example: return { data, message: 'ok', meta: { page, limit, total } }
        let data: T = body;
        let message: string | undefined;
        let meta: Record<string, unknown> | undefined;

        if (body && typeof body === 'object' && ('data' in body || 'meta' in body || 'message' in body)) {
          data = (body.data ?? body) as T;
          message = body.message;
          meta = body.meta;
        }

        return {
          success: true,
          data,
          message,
          path: request?.url,
          timestamp: new Date().toISOString(),
          meta,
        };
      }),
    );
  }
}
