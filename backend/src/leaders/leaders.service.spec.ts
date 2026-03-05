import { ConflictException } from '@nestjs/common';
import { MandateStatus } from '@prisma/client';
import { LeaderService } from './leaders.service';

describe('LeaderService', () => {
  const prisma = {
    person: { findUnique: jest.fn() },
    representativeMandate: { findFirst: jest.fn() },
    leader: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  } as any;

  let service: LeaderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new LeaderService(prisma);
  });

  it('no permite crear líder si hay mandato ACTIVE', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.representativeMandate.findFirst.mockResolvedValue({ id: 'm1', status: MandateStatus.ACTIVE });

    await expect(
      service.create({ personId: 'p1', faculty: 'F', program: 'P', startDate: '2026-01-01' }, 'admin'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
