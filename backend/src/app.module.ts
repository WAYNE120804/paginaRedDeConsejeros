import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { PeopleModule } from './people/people.module';
import { RepresentationModule } from './representation/representation.module';
import { LeadersModule } from './leaders/leaders.module';
import { BoardModule } from './board/board.module';
import { StorageModule } from './storage/storage.module';
import { EventsModule } from './events/events.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AppController } from './app.controller';
import { NewsModule } from './news/news.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    AdminUsersModule,
    PeopleModule,
    RepresentationModule,
    LeadersModule,
    BoardModule,
    EventsModule,
    AttendanceModule,
    NewsModule,
    DocumentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
