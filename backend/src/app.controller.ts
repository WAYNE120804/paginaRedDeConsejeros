import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      data: {
        name: 'red-consejeros-api',
        status: 'ok',
      },
      error: null,
    };
  }
}
