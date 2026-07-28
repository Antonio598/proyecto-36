import PacienteGuard from '@/components/PacienteGuard';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PacienteGuard>{children}</PacienteGuard>;
}
