import { Module } from '@nestjs/common';
import { NotificationWorkerController } from './notification-worker.controller';
import { NotificationWorkerService } from './notification-worker.service';

@Module({
  imports: [],
  controllers: [NotificationWorkerController],
  providers: [NotificationWorkerService],
})
export class NotificationWorkerModule {}
