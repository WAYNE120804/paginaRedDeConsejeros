import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { AdminRole } from '../../common/enums/admin-role.enum';

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(AdminRole)
  role!: AdminRole;
}
