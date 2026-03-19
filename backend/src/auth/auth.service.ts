import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.usersRepo.findOne({
      where: { username },
    });

    if (!user || !user.password || !user.isActive) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      }),
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterUserDto) {
    const existing = await this.usersRepo.findOne({
      where: { username: dto.username },
    });

    if (existing) {
      throw new BadRequestException('Ese nombre de usuario ya existe');
    }

    const password = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      fullName: dto.fullName,
      username: dto.username,
      password,
      role: dto.role ?? UserRole.OPERATOR,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.usersRepo.save(user);

    return {
      message: 'Usuario registrado correctamente',
      user: {
        id: saved.id,
        fullName: saved.fullName,
        username: saved.username,
        role: saved.role,
        isActive: saved.isActive,
      },
    };
  }

  async changePassword(dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new BadRequestException('El usuario no existe');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepo.save(user);

    return {
      message: 'Contraseña actualizada correctamente',
    };
  }
}