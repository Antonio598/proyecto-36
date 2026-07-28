import prisma from '@/lib/prisma';

export async function getPacienteUser(request: Request) {
  const pacienteId = request.headers.get('x-paciente-id');
  if (!pacienteId) return null;
  return await (prisma as any).patientUser.findUnique({ where: { id: pacienteId } });
}
