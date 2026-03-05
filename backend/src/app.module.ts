import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { PeopleModule } from './people/people.module';
import { RepresentationModule } from './representation/representation.module';
import { LeadersModule } from './leaders/leaders.module';
import { BoardModule } from './board/board.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    AdminUsersModule,
    PeopleModule,
    RepresentationModule,
    LeadersModule,
    BoardModule,
  ],
})
export class AppModule {}
