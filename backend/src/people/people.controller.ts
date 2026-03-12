import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '../common/enums/admin-role.enum';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('people')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPERADMIN, AdminRole.SECRETARIO)
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Post()
  async create(@Body() dto: CreatePersonDto, @Req() req: RequestWithUser) {
    const data = await this.peopleService.create(dto, req.user.sub);
    return { data, error: null };
  }

  @Get()
  async search(@Query('query') query?: string) {
    const data = await this.peopleService.search(query);
    return { data, error: null };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.peopleService.getById(id);
    return { data, error: null };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePersonDto, @Req() req: RequestWithUser) {
    const data = await this.peopleService.update(id, dto, req.user.sub);
    return { data, error: null };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: RequestWithUser) {
    const data = await this.peopleService.delete(id, req.user.sub);
    return { data, error: null };
  }
}
