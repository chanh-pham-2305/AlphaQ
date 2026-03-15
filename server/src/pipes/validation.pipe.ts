/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
//custom throw first message
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const firstError = errors[0];

      if (firstError.constraints) {
        // get first error message
        const firstErrorMessage = Object.values(firstError.constraints)[0];

        throw new BadRequestException({
          statusCode: 400,
          message: firstErrorMessage,
          error: 'Bad Request',
        });
      } else {
        throw new BadRequestException({
          message: `Validation failed for field: ${firstError.property}`,
          error: 'Bad Request',
          statusCode: 400,
        });
      }
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
