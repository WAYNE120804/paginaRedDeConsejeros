import { Injectable } from '@nestjs/common';
import { MandateStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async representativesActiveXlsx() {
    const rows = await this.prisma.representativeMandate.findMany({
      where: { status: MandateStatus.ACTIVE },
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    });
    return this.createWorkbook('Representantes Activos', [
      ['Nombre', 'Código', 'Correo', 'Estamento', 'Facultad', 'Programa', 'Inicio'],
      ...rows.map((r) => [r.person.fullName, r.person.studentCode, r.person.institutionalEmail, r.estateType, r.faculty, r.program, r.startDate.toISOString()]),
    ]);
  }

  async representativesHistoryXlsx(personId?: string) {
    const rows = await this.prisma.representativeMandate.findMany({
      where: personId ? { personId } : {},
      include: { person: true },
      orderBy: { createdAt: 'desc' },
    });
    return this.createWorkbook('Histórico Representantes', [
      ['Nombre', 'Código', 'Correo', 'Estado', 'Inicio', 'Fin'],
      ...rows.map((r) => [r.person.fullName, r.person.studentCode, r.person.institutionalEmail, r.status, r.startDate.toISOString(), r.endDate?.toISOString() ?? '']),
    ]);
  }

  async leadersXlsx() {
    const rows = await this.prisma.leader.findMany({ include: { person: true }, orderBy: { createdAt: 'desc' } });
    return this.createWorkbook('Líderes', [
      ['Nombre', 'Código', 'Correo', 'Facultad', 'Programa', 'Activo', 'Inicio', 'Fin'],
      ...rows.map((r) => [r.person.fullName, r.person.studentCode, r.person.institutionalEmail, r.faculty, r.program, r.isActive ? 'SI' : 'NO', r.startDate.toISOString(), r.endDate?.toISOString() ?? '']),
    ]);
  }

  async boardXlsx() {
    const rows = await this.prisma.boardMandate.findMany({ include: { person: true }, orderBy: { createdAt: 'desc' } });
    return this.createWorkbook('Junta', [
      ['Nombre', 'Código', 'Correo', 'Cargo', 'Activo', 'Inicio', 'Fin'],
      ...rows.map((r) => [r.person.fullName, r.person.studentCode, r.person.institutionalEmail, r.position, r.isActive ? 'SI' : 'NO', r.startDate.toISOString(), r.endDate?.toISOString() ?? '']),
    ]);
  }

  private async createWorkbook(sheetName: string, rows: Array<Array<string>>) {
    let ExcelJS: any;
    try {
      ExcelJS = require('exceljs');
    } catch {
      return Buffer.from(rows.map((r) => r.join(',')).join('\n'), 'utf-8');
    }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    rows.forEach((row) => sheet.addRow(row));
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
