import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      ok: true,
      message: 'Backend funcionando en Cloud Run 🚀',
    };
  }
}