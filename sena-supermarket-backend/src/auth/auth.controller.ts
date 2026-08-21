import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/instructor/register')
  registerInstructor(@Body() body: { name: string; email: string; password: string; instructorKey: string }) { return this.authService.registerInstructor(body.name, body.email, body.password, body.instructorKey); }

  @Post('auth/instructor/login')
  loginInstructor(@Body() body: { email: string; password: string }) { return this.authService.loginInstructor(body.email, body.password); }

  @Post('rooms')
  createRoom(@Body() body: { instructorId: string; name: string }) { return this.authService.createRoom(body.instructorId, body.name); }

  @Post('rooms/close')
  closeRoom(@Body() body: { instructorId: string; roomCode: string }) { return this.authService.closeRoom(body.instructorId, body.roomCode); }

  @Get('rooms/:code/status')
  getRoomStatus(@Param('code') code: string) { return this.authService.getRoomStatus(code); }

  @Post('auth/apprentice/register')
  registerApprentice(@Body() body: { name: string; ficha: string; gender: 'masculino' | 'femenino'; password: string; roomCode: string }) { return this.authService.registerApprentice(body.name, body.ficha, body.gender, body.password, body.roomCode); }

  @Post('auth/apprentice/login')
  loginApprentice(@Body() body: { name: string; ficha: string; password: string; roomCode: string }) { return this.authService.loginApprentice(body.name, body.ficha, body.password, body.roomCode); }
}