import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdminUserDto, actorId: string) {
    const exists = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.adminUser.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'CREATE_ADMIN_USER',
        entity: 'ADMIN_USER',
        entityId: user.id,
        metadata: { email: user.email, role: user.role },
      },
    });

    return { id: user.id, email: user.email, role: user.role, isActive: user.isActive };
  }

  async resetPassword(id: string, temporaryPassword: string, actorId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.adminUser.update({ where: { id }, data: { passwordHash } });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'RESET_ADMIN_PASSWORD',
        entity: 'ADMIN_USER',
        entityId: id,
        metadata: { email: user.email },
      },
    });

    return { success: true };
  }

  async disable(id: string, actorId: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.adminUser.update({ where: { id }, data: { isActive: false } });

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action: 'DISABLE_ADMIN_USER',
        entity: 'ADMIN_USER',
        entityId: id,
        metadata: { email: user.email },
      },
    });

    return { success: true };
  }
}
