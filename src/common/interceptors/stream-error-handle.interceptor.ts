import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { catchError, map, Observable, tap } from 'rxjs';
import { Response } from 'express';
import { ReadStream } from 'fs';

@Injectable()
export class StreamErrorHandleInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const res = context.switchToHttp().getResponse() as Response;

    return next.handle().pipe(
      map((data) => {
        if (data instanceof ReadStream) {
          data.on('error', (e) => {
            data.destroy();
            res.status(404).json(new NotFoundException().getResponse());
          });

          return new StreamableFile(data, { type: '' });
        }

        return data;
      }),
    );
  }
}
