import { NotFoundException } from '@nestjs/common';
import { EventVisibility } from '@prisma/client';
import { EventsService } from './events.service';

describe('EventsService', () => {
  const prisma = {
    event: { findFirst: jest.fn() },
    eventPhoto: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
    auditLog: { create: jest.fn() },
  } as any;

  const storage = {
    saveFile: jest.fn(),
    deleteFile: jest.fn(),
  } as any;

  let service: EventsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventsService(prisma, storage);
  });

  it('subir foto crea registro en DB', async () => {
    prisma.event.findFirst.mockResolvedValue({ id: 'e1', slug: 'mi-evento', deletedAt: null });
    storage.saveFile.mockResolvedValue({ logicalPath: '/uploads/eventos/mi-evento/foto.webp' });
    prisma.eventPhoto.create.mockResolvedValue({ id: 'p1', eventId: 'e1', photoUrl: '/uploads/eventos/mi-evento/foto.webp' });
    prisma.auditLog.create.mockResolvedValue({});

    const result = await service.uploadPhoto(
      'e1',
      { originalname: 'Foto WEBP.webp', buffer: Buffer.from('img') } as any,
      'admin',
    );

    expect(prisma.eventPhoto.create).toHaveBeenCalled();
    expect(result.photoUrl).toContain('/uploads/eventos/mi-evento/');
  });

  it('evento oculto no se ve desde endpoint público', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'e1',
      slug: 'oculto',
      visibility: EventVisibility.HIDDEN,
      date: new Date('2026-01-01'),
      startTime: '10:00',
      endTime: '11:00',
      photos: [],
    });

    await expect(service.getBySlug('oculto')).rejects.toBeInstanceOf(NotFoundException);
  });
});
