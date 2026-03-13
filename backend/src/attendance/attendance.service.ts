import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceMode, MandateStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';
import { ListAttendanceSessionsQueryDto } from './dto/list-attendance-sessions-query.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(dto: CreateAttendanceSessionDto, adminId: string) {
    const activeFrom = new Date(dto.activeFrom);
    const activeUntil = new Date(dto.activeUntil);
    if (activeUntil <= activeFrom) {
      throw new BadRequestException('active_until debe ser mayor que active_from');
    }

    if (dto.eventId) {
      const event = await this.prisma.event.findFirst({ where: { id: dto.eventId, deletedAt: null } });
      if (!event) throw new NotFoundException('Evento no encontrado para la sesión');
    }

    const token = randomBytes(24).toString('hex');
    const session = await this.prisma.attendanceSession.create({
      data: {
        type: dto.type,
        eventId: dto.eventId,
        name: dto.name,
        shortDescription: dto.shortDescription,
        token,
        activeFrom,
        activeUntil,
        allowManual: dto.allowManual,
        createdByAdminId: adminId,
      },
    });

    await this.log(adminId, 'CREATE_ATTENDANCE_SESSION', session.id, { type: dto.type, eventId: dto.eventId ?? null });
    return session;
  }


  async listSessions(query: ListAttendanceSessionsQueryDto) {
    const where: Prisma.AttendanceSessionWhereInput = {};

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
        { shortDescription: { contains: q, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    if (query.eventId?.trim()) {
      where.eventId = query.eventId.trim();
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.from || query.to) {
      where.activeFrom = {};
      if (query.from) {
        where.activeFrom.gte = new Date(query.from);
      }
      if (query.to) {
        where.activeFrom.lte = new Date(query.to);
      }
    }

    return this.prisma.attendanceSession.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            records: true,
          },
        },
      },
      orderBy: { activeFrom: 'desc' },
    });
  }

  async getSessionDetails(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({ where: { id }, include: { event: true } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const frontendBaseUrl = process.env.FRONTEND_PUBLIC_URL ?? 'http://localhost:3000';
    const scanUrl = `${frontendBaseUrl}/asistencia/scan/${session.token}`;
    const qrDataUrl = await this.generateQrDataUrl(scanUrl);

    return { ...session, scanUrl, qrDataUrl };
  }

  async listRecords(sessionId: string) {
    await this.ensureSession(sessionId);
    return this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { person: true, recordedByAdmin: { select: { email: true } } },
      orderBy: { timestamp: 'asc' },
    });
  }

  async recordManual(sessionId: string, dto: ManualAttendanceDto, adminId: string) {
    const session = await this.ensureSession(sessionId);
    if (!session.allowManual) {
      throw new ForbiddenException('Esta sesión no permite registro manual');
    }

    const person = await this.findOrCreatePerson(dto);
    const record = await this.createRecord({
      sessionId,
      personId: person.id,
      mode: AttendanceMode.MANUAL,
      note: dto.note,
      recordedByAdminId: adminId,
    });

    await this.log(adminId, 'MANUAL_ATTENDANCE_RECORD', sessionId, {
      personId: person.id,
      studentCode: person.studentCode,
    });

    return record;
  }

  async scanByToken(token: string, dto: ScanAttendanceDto) {
    const session = await this.prisma.attendanceSession.findUnique({ where: { token } });
    if (!session) throw new NotFoundException('Sesión inválida');

    const now = new Date();
    if (now < session.activeFrom || now > session.activeUntil) {
      throw new BadRequestException('SESSION_OUT_OF_WINDOW');
    }

    const normalizedStudentCode = dto.studentCode.trim();
    if (!normalizedStudentCode) {
      throw new BadRequestException('studentCode es requerido');
    }

    let person = await this.prisma.person.findUnique({ where: { studentCode: normalizedStudentCode } });
    if (!person) {
      person = await this.registerScanPerson(normalizedStudentCode, dto);
    }

    const record = await this.createRecord({
      sessionId: session.id,
      personId: person.id,
      mode: AttendanceMode.QR,
      note: this.buildScanNote(dto),
    });

    return { success: true, recordId: record.id, timestamp: record.timestamp };
  }

  async exportXlsx(sessionId: string): Promise<Buffer> {
    const session = await this.ensureSession(sessionId);

    const records = await this.prisma.attendanceRecord.findMany({
      where: { sessionId: session.id },
      include: {
        person: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    let ExcelJS: any;
    try {
      ExcelJS = require('exceljs');
    } catch {
      const lines = ['Nombre,Código,Correo,Rol actual,Fecha y hora,Modo'];
      for (const record of records) {
        const currentRole = await this.getCurrentRole(record.personId);
        lines.push(
          `${record.person.fullName},${record.person.studentCode},${record.person.institutionalEmail},${currentRole},${this.formatDateTime(record.timestamp)},${record.mode}`,
        );
      }
      return Buffer.from(lines.join('\n'), 'utf-8');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asistencia');
    sheet.columns = [
      { header: 'Nombre', key: 'fullName', width: 30 },
      { header: 'Código', key: 'studentCode', width: 18 },
      { header: 'Correo', key: 'institutionalEmail', width: 30 },
      { header: 'Rol actual', key: 'currentRole', width: 20 },
      { header: 'Fecha y hora', key: 'timestamp', width: 25 },
      { header: 'Modo', key: 'mode', width: 12 },
    ];

    for (const record of records) {
      const currentRole = await this.getCurrentRole(record.personId);
      sheet.addRow({
        fullName: record.person.fullName,
        studentCode: record.person.studentCode,
        institutionalEmail: record.person.institutionalEmail,
        currentRole,
        timestamp: this.formatDateTime(record.timestamp),
        mode: record.mode,
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async findOrCreatePerson(dto: ManualAttendanceDto) {
    const studentCode = dto.studentCode.trim();
    if (!studentCode) {
      throw new BadRequestException('studentCode es requerido');
    }

    const existing = await this.prisma.person.findUnique({ where: { studentCode } });
    if (existing) return existing;

    if (!dto.fullName || !dto.institutionalEmail) {
      throw new BadRequestException(
        'Persona no registrada. Para crearla manualmente se requiere fullName e institutionalEmail',
      );
    }

    try {
      return await this.prisma.person.create({
        data: {
          studentCode,
          fullName: dto.fullName,
          institutionalEmail: dto.institutionalEmail,
        },
      });
    } catch {
      throw new ConflictException('No se pudo crear persona. Código o correo ya existe');
    }
  }

  private async registerScanPerson(studentCode: string, dto: ScanAttendanceDto) {
    const fullName = dto.fullName?.trim();
    const institutionalEmail = dto.institutionalEmail?.trim().toLowerCase();
    const phone = dto.phone?.trim() || undefined;

    if (!fullName || !institutionalEmail) {
      throw new NotFoundException('NOT_REGISTERED');
    }

    try {
      return await this.prisma.person.create({
        data: {
          studentCode,
          fullName,
          institutionalEmail,
          phone,
        },
      });
    } catch {
      throw new ConflictException('No se pudo crear persona. Código o correo ya existe');
    }
  }

  private buildScanNote(dto: ScanAttendanceDto) {
    const parts = [
      dto.position?.trim() ? `Cargo: ${dto.position.trim()}` : null,
      dto.organization?.trim() ? `Entidad: ${dto.organization.trim()}` : null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' | ') : undefined;
  }

  private async createRecord(input: {
    sessionId: string;
    personId: string;
    mode: AttendanceMode;
    note?: string;
    recordedByAdminId?: string;
  }) {
    try {
      return await this.prisma.attendanceRecord.create({ data: input });
    } catch {
      throw new ConflictException('La persona ya tiene asistencia registrada en esta sesión');
    }
  }

  private async ensureSession(sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    return session;
  }


  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'medium',
      hour12: false,
      timeZone: process.env.APP_TIMEZONE ?? 'America/Bogota',
    }).format(date);
  }

  private async getCurrentRole(personId: string): Promise<string> {
    const [activeRep, activeLeader] = await Promise.all([
      this.prisma.representativeMandate.findFirst({ where: { personId, status: MandateStatus.ACTIVE } }),
      this.prisma.leader.findFirst({ where: { personId, isActive: true } }),
    ]);

    if (activeRep) return 'REPRESENTANTE';
    if (activeLeader) return 'LIDER';
    return 'NINGUNO';
  }

  private async log(actorId: string, action: string, entityId: string, metadata: Prisma.InputJsonObject) {
    await this.prisma.auditLog.create({
      data: {
        actorAdminId: actorId,
        action,
        entity: 'ATTENDANCE',
        entityId,
        metadata,
      },
    });
  }

  private async generateQrDataUrl(scanUrl: string): Promise<string> {
    try {
      const QRCode = require('qrcode');
      return QRCode.toDataURL(scanUrl);
    } catch {
      return `data:text/plain;base64,${Buffer.from(scanUrl).toString('base64')}`;
    }
  }
}
