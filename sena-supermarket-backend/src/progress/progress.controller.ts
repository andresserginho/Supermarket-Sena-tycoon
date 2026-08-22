import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get(':apprenticeId')
  get(@Param('apprenticeId') apprenticeId: string) {
    return this.progressService.get(apprenticeId);
  }

  @Put(':apprenticeId')
  update(@Param('apprenticeId') apprenticeId: string, @Body() body: any) {
    return this.progressService.update(apprenticeId, body);
  }
}
