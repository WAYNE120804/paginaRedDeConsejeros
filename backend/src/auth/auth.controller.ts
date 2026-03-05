import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestWithUser } from '../common/interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
    });

    return {
      data: { email: result.email, role: result.role, accessToken: result.accessToken },
      error: null,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.sub);
    res.clearCookie('access_token');
    return { data: { success: true }, error: null };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: RequestWithUser) {
    const me = await this.authService.me(req.user.sub);
    return { data: me, error: null };
  }
}
