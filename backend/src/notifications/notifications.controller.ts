import { Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findForUser(@CurrentUser() user: any) {
    return this.service.findForUser(user.schoolId, user.role);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }

  @Put('mark-all-read')
  markAllRead(@CurrentUser() user: any) {
    return this.service.markAllRead(user.schoolId, user.role);
  }
}
