import { Job } from '@/entity/job.entity';
import { Body, Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateJobDto } from './dto/create-job.dto';
import { JobSearchQueryDto } from './dto/job-search-query.dto';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'job 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'job 목록 조회 성공',
    type: [Job],
  })
  async getAllJobs(): Promise<Job[]> {
    return this.jobsService.getAllJobs();
  }

  @Post()
  @ApiOperation({ summary: 'job 생성' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'job 생성 성공',
    type: Job,
  })
  @ApiBody({ type: CreateJobDto })
  async createJob(@Body() createJobDto: CreateJobDto): Promise<Job> {
    return this.jobsService.createJob(createJobDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'job 검색' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'job 검색 성공',
    type: [Job],
  })
  async searchJob(@Query() query: JobSearchQueryDto): Promise<Job[] | undefined> {
    return this.jobsService.searchJob(query);
  }

  /**
   * id, index는 변하지 않으니까 cache로 갖고 있기 가능할 듯.
   * getIndex 생략 -> cache Mem 접근
   * @param id
   * @returns
   */
  @Get(':id')
  @ApiOperation({ summary: 'job 상세 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'job 상세 조회 성공',
    type: Job,
  })
  @ApiParam({ name: 'id', type: String, description: 'job id' })
  async getJobDetail(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<Job> {
    return this.jobsService.getJobDetail(id);
  }
}
