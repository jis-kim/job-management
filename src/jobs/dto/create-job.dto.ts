import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({ description: 'job 제목', example: 'process-image' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  @ApiProperty({
    description: 'job 설명',
    example: 'Process image and save to database',
  })
  description: string;
}
