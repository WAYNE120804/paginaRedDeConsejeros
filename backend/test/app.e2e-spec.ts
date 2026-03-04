import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Auth + Roles (e2e)', () => {
  let app: INestApplication;

  const superadmin = {
    id: '1',
    email: 'admin.ti@umanizales.edu.co',
    passwordHash: '',
    role: 'SUPERADMIN',
    isActive: true,
  } as any;

  const secretario = {
    id: '2',
    email: 'secretario@umanizales.edu.co',
    passwordHash: '',
    role: 'SECRETARIO',
    isActive: true,
  } as any;

  const prismaMock = {
    adminUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  } as any;

  beforeAll(async () => {
    superadmin.passwordHash = await bcrypt.hash('Admin123!', 10);
    secretario.passwordHash = await bcrypt.hash('Secretario123!', 10);

    prismaMock.adminUser.findUnique.mockImplementation(({ where }: any) => {
      if (where.email === superadmin.email) return Promise.resolve(superadmin);
      if (where.email === secretario.email) return Promise.resolve(secretario);
      if (where.id === superadmin.id) return Promise.resolve(superadmin);
      if (where.id === secretario.id) return Promise.resolve(secretario);
      return Promise.resolve(null);
    });
    prismaMock.adminUser.update.mockResolvedValue(superadmin);
    prismaMock.adminUser.create.mockResolvedValue({ id: '3', email: 'new@u.edu', role: 'SECRETARIO', isActive: true });
    prismaMock.auditLog.create.mockResolvedValue({});

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/auth/login + /api/auth/me (SUPERADMIN)', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: superadmin.email, password: 'Admin123!' })
      .expect(201);

    expect(loginRes.body.data.role).toBe('SUPERADMIN');
    const cookie = loginRes.headers['set-cookie'][0];

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(meRes.body.data.email).toBe(superadmin.email);
  });

  it('/api/admin-users blocked for SECRETARIO', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: secretario.email, password: 'Secretario123!' })
      .expect(201);

    const cookie = loginRes.headers['set-cookie'][0];

    await request(app.getHttpServer())
      .post('/api/admin-users')
      .set('Cookie', cookie)
      .send({ email: 'new@u.edu', password: 'Temporal123!', role: 'SECRETARIO' })
      .expect(403);
  });
});
