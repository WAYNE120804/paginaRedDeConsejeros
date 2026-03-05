import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  const prisma = {
    attendanceSession: { findUnique: jest.fn(), create: jest.fn() },
    attendanceRecord: { create: jest.fn(), findMany: jest.fn() },
    person: { findUnique: jest.fn(), create: jest.fn() },
    event: { findFirst: jest.fn() },
    representativeMandate: { findFirst: jest.fn() },
    leader: { findFirst: jest.fn() },
    auditLog: { create: jest.fn() },
  } as any;

  let service: AttendanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttendanceService(prisma);
  });

  it('registro QR fuera de ventana falla', async () => {
    prisma.attendanceSession.findUnique.mockResolvedValue({
      id: 's1',
      activeFrom: new Date('2099-01-01T10:00:00Z'),
      activeUntil: new Date('2099-01-01T12:00:00Z'),
    });

    await expect(service.scanByToken('token', { studentCode: '2026' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registro QR dentro funciona', async () => {
    const now = new Date();
    prisma.attendanceSession.findUnique.mockResolvedValue({
      id: 's1',
      activeFrom: new Date(now.getTime() - 60_000),
      activeUntil: new Date(now.getTime() + 60_000),
    });
    prisma.person.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.attendanceRecord.create.mockResolvedValue({ id: 'r1', timestamp: now });

    const res = await service.scanByToken('token', { studentCode: '2026' });
    expect(res.success).toBe(true);
  });

  it('manual crea persona si no existe (allow_manual)', async () => {
    prisma.attendanceSession.findUnique.mockResolvedValue({ id: 's1', allowManual: true });
    prisma.person.findUnique.mockResolvedValue(null);
    prisma.person.create.mockResolvedValue({ id: 'p1', studentCode: '2026' });
    prisma.attendanceRecord.create.mockResolvedValue({ id: 'r1' });
    prisma.auditLog.create.mockResolvedValue({});

    await service.recordManual(
      's1',
      { studentCode: '2026', fullName: 'Nuevo', institutionalEmail: 'nuevo@umanizales.edu.co' },
      'admin1',
    );

    expect(prisma.person.create).toHaveBeenCalled();
  });

  it('export excel produce archivo', async () => {
    prisma.attendanceSession.findUnique.mockResolvedValue({ id: 's1' });
    prisma.attendanceRecord.findMany.mockResolvedValue([
      {
        personId: 'p1',
        timestamp: new Date(),
        mode: 'QR',
        person: { fullName: 'A', studentCode: '1', institutionalEmail: 'a@u.edu' },
      },
    ]);
    prisma.representativeMandate.findFirst.mockResolvedValue(null);
    prisma.leader.findFirst.mockResolvedValue(null);

    const buffer = await service.exportXlsx('s1');
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('scan retorna NOT_REGISTERED si persona no existe', async () => {
    const now = new Date();
    prisma.attendanceSession.findUnique.mockResolvedValue({
      id: 's1',
      activeFrom: new Date(now.getTime() - 60_000),
      activeUntil: new Date(now.getTime() + 60_000),
    });
    prisma.person.findUnique.mockResolvedValue(null);

    await expect(service.scanByToken('token', { studentCode: '404' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
