import { Job } from '@/entity/job.entity';
import { CreateJobDto } from '@/jobs/dto/create-job.dto';
import { JobsService } from '@/jobs/jobs.service';
import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}
  @Post()
  @ApiOperation({ summary: 'job 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'job 생성 성공',
    type: Job,
  })
  @ApiBody({ type: CreateJobDto })
  async createJob(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.createJob(createJobDto);
  }
}
