import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools/:schoolId/messages')
export class MessagesController {
  constructor(private service: MessagesService) {}

  @Post()
  send(
    @Param('schoolId') schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.send(schoolId, user, dto);
  }

  @Get('inbox')
  inbox(@Param('schoolId') schoolId: string, @CurrentUser() user: any) {
    return this.service.getInbox(schoolId, user.id);
  }

  @Get('unread-count')
  unreadCount(@Param('schoolId') schoolId: string, @CurrentUser() user: any) {
    return this.service.countUnread(schoolId, user.id);
  }

  @Get(':partnerId')
  conversation(
    @Param('schoolId') schoolId: string,
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getConversation(schoolId, user.id, partnerId);
  }

  @Put(':partnerId/mark-read')
  markRead(
    @Param('schoolId') schoolId: string,
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.markRead(schoolId, user.id, partnerId);
  }
}
