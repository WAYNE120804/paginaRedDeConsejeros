import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { AdminRole } from '../common/enums/admin-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string; email: string; role: AdminRole }> {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { sub: user.id, email: user.email, role: user.role as AdminRole };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.auditLog.create({
      data: {
        actorAdminId: user.id,
        action: 'LOGIN',
        entity: 'AUTH',
        metadata: { email: user.email },
      },
    });

    return { accessToken, email: user.email, role: user.role as AdminRole };
  }

  async me(userId: string): Promise<{ email: string; role: AdminRole }> {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return { email: user.email, role: user.role as AdminRole };
  }

  async logout(actorId?: string): Promise<void> {
    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorAdminId: actorId,
          action: 'LOGOUT',
          entity: 'AUTH',
          metadata: {},
        },
      });
    }
  }
}
