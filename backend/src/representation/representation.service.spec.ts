import { ConflictException, BadRequestException } from '@nestjs/common';
import { MandateStatus } from '@prisma/client';
import { RepresentationService } from './representation.service';

describe('RepresentationService', () => {
  const prisma = {
    person: { findUnique: jest.fn() },
    leader: { findFirst: jest.fn() },
    representativeMandate: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  } as any;

  let service: RepresentationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RepresentationService(prisma);
  });

  it('no permite crear mandato ACTIVE si existe otro ACTIVE', async () => {
    prisma.person.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.leader.findFirst.mockResolvedValue(null);
    prisma.representativeMandate.findFirst.mockResolvedValue({ id: 'm1', status: MandateStatus.ACTIVE });

    await expect(
      service.createMandate(
        { personId: 'p1', estateType: 'EST', faculty: 'F', program: 'P', startDate: '2026-01-01' },
        'admin',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('cierre exige end_date válida (>= start_date)', async () => {
    prisma.representativeMandate.findUnique.mockResolvedValue({
      id: 'm1',
      status: MandateStatus.ACTIVE,
      startDate: new Date('2026-02-01'),
    });

    await expect(service.closeMandate('m1', '2026-01-01', 'admin')).rejects.toBeInstanceOf(BadRequestException);
  });
});
