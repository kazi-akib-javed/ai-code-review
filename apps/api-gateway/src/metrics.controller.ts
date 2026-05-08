import { Controller, Get, Res } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';

@Controller()
export class MetricsController extends PrometheusController {
  @Get('metrics')
  async index(@Res() res: Response): Promise<string> {
    return super.index(res);
  }
}