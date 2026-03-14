import { 
  Users, 
  CalendarCheck, 
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard | MedSaaS',
};

const stats = [
  { name: 'Citas Hoy', value: '0', icon: CalendarCheck, change: '0', changeType: 'increase' },
  { name: 'Pacientes Nuevos', value: '0', icon: Users, change: '0%', changeType: 'increase' },
  { name: 'Ingresos Mes', value: '$0', icon: TrendingUp, change: '0%', changeType: 'increase' },
];

const upcomingAppointments: any[] = [];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Resumen General</h2>
        <p className="mt-1 text-sm text-gray-500">
          Métricas clave y próximas citas de tu consultorio.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md"
          >
            <dt>
              <div className="absolute rounded-md bg-blue-500/10 p-3">
                <item.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-1 sm:pb-2">
              <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {item.changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4 flex-shrink-0 self-center text-green-500" aria-hidden="true" />
                ) : null}
                <span className="sr-only">
                  {item.changeType === 'increase' ? 'Increased by' : 'Decreased by'}
                </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Próximas Citas Widget */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Próximas Citas (Hoy)</h3>
          <Link href="/calendar" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Ver Calendario &rarr;
          </Link>
        </div>
        <ul role="list" className="divide-y divide-gray-100">
          {upcomingAppointments.map((appt) => (
            <li key={appt.id} className="px-6 py-5 flex justify-between gap-x-6 hover:bg-gray-50 transition-colors">
              <div className="flex min-w-0 gap-x-4 items-center">
                <div className="h-10 w-10 flex-none rounded-full bg-blue-50 flex flex-col items-center justify-center text-blue-700 font-bold">
                  {appt.patient.charAt(0)}
                </div>
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-gray-900">{appt.patient}</p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-500">{appt.service}</p>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center">
                <div className="flex items-center gap-1 text-sm leading-6 text-gray-900 font-medium">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {appt.time}
                </div>
                <div className="mt-1 flex items-center gap-x-1.5">
                  <div className={`flex-none rounded-full p-1 ${appt.status === 'Confirmada' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${appt.status === 'Confirmada' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  </div>
                  <p className="text-xs leading-5 text-gray-500">{appt.status}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
