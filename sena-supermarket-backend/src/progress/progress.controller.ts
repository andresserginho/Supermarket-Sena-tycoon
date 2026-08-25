import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
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

  @Post(':apprenticeId/health-recovery')
  recoverHealth(@Param('apprenticeId') apprenticeId: string) {
    return this.progressService.recoverHealth(apprenticeId);
  }

  @Get(':apprenticeId/warehouse')
  getWarehouse(@Param('apprenticeId') apprenticeId: string) {
    return this.progressService.getWarehouse(apprenticeId);
  }

  @Put(':apprenticeId/warehouse')
  updateWarehouse(@Param('apprenticeId') apprenticeId: string, @Body() body: { items: any[] }) {
    return this.progressService.updateWarehouse(apprenticeId, body.items ?? []);
  }

  @Put(':apprenticeId/warehouse/boxes')
  updateBoxes(@Param('apprenticeId') apprenticeId: string, @Body() body: { items: any[] }) {
    return this.progressService.updateBoxes(apprenticeId, body.items ?? []);
  }

  @Get('room/:code')
  getRoomProgress(@Param('code') code: string, @Query('instructorId') instructorId: string) {
    return this.progressService.getRoomProgress(code, instructorId);
  }

  @Get(':apprenticeId/products')
  getProducts(@Param('apprenticeId') apprenticeId: string) {
    return this.progressService.getProducts(apprenticeId);
  }

  @Put(':apprenticeId/products')
  updateProducts(@Param('apprenticeId') apprenticeId: string, @Body() body: { items: any[] }) {
    return this.progressService.updateProducts(apprenticeId, body.items ?? []);
  }
}
