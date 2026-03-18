'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Stethoscope, 
  Clock, 
  FileText,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface Patient {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: {
    name: string;
    durationMinutes: number;
    price: number;
    colorCode: string;
  };
}

export default function PatientHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatientData = async () => {
      setIsLoading(true);
      try {
        const [patientRes, historyRes] = await Promise.all([
          fetch(`/api/patients/${id}`),
          fetch(`/api/appointments/history/${id}`)
        ]);

        if (!patientRes.ok) throw new Error('No se pudo encontrar al paciente');
        
        setPatient(await patientRes.json());

        const historyData = await historyRes.json();
        const { formatInTimeZone } = require('date-fns-tz');
        const PANAMA_TZ = 'America/Panama';

        const formattedHistory = historyData.map((appt: any) => {
          const naiveStartStr = formatInTimeZone(new Date(appt.startTime), PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ss");
          const naiveEndStr = formatInTimeZone(new Date(appt.endTime), PANAMA_TZ, "yyyy-MM-dd'T'HH:mm:ss");
          return {
             ...appt,
             startTime: naiveStartStr,
             endTime: naiveEndStr
          };
        });
        
        setAppointments(formattedHistory);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-800">Error</h2>
        <p className="text-red-600 mb-6">{error || 'Paciente no encontrado'}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors">
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      {/* Header / Breadcrumb */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-black">Historial del Paciente</h2>
          <div className="flex items-center text-sm font-bold text-black/50 gap-2">
            <Link href="/patients" className="hover:text-blue-600 transition-colors">Pacientes</Link>
            <ChevronRight className="w-4 h-4" />
            <span>{patient.fullName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Patient Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-xl mb-4 transform -rotate-3 group-hover:rotate-0 transition-transform">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-black text-black mb-1">{patient.fullName}</h3>
              <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">ID: {patient.id.substring(0, 8)}</p>
            </div>

            <div className="space-y-6 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-4">
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                  <p className="text-sm font-bold text-black underline decoration-blue-200 decoration-2">{patient.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-black">{patient.email || 'No registrado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Miembro desde</p>
                  <p className="text-sm font-bold text-black">{format(new Date(patient.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              </div>
            </div>

            {patient.notes && (
              <div className="mt-8 bg-amber-50 p-5 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                   <FileText className="w-4 h-4 text-amber-600" />
                   <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest">Notas Clínicas</h4>
                </div>
                <p className="text-sm font-bold text-amber-900 leading-relaxed">{patient.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Appointments Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm h-full">
            <h3 className="text-lg font-black text-black mb-8 flex items-center gap-3">
               <CalendarIcon className="w-6 h-6 text-blue-600" />
               Línea de Tiempo de Citas
            </h3>

            {appointments.length > 0 ? (
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-gray-100 before:to-transparent">
                {appointments.map((appt) => (
                  <div key={appt.id} className="relative flex items-start gap-6 group">
                    <div className="absolute left-0 mt-1.5 w-10 h-10 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform">
                       <Stethoscope className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-14 flex-1">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <span className="text-sm font-black text-black block sm:inline">{format(new Date(appt.startTime), "EEEE, d 'de' MMMM", { locale: es })}</span>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-0 sm:ml-2">
                               {format(new Date(appt.startTime), "HH:mm")} hrs
                            </span>
                          </div>
                          <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {appt.status === 'CONFIRMED' ? 'Realizada' : 'Cancelada'}
                          </span>
                       </div>
                       
                       <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:bg-gray-50 transition-colors shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: appt.service.colorCode }} />
                                <span className="font-black text-black">{appt.service.name}</span>
                             </div>
                             <span className="font-black text-gray-900">${appt.service.price.toFixed(2)}</span>
                          </div>
                          
                          {appt.notes ? (
                            <p className="text-sm font-bold text-black/60 italic border-l-2 border-gray-200 pl-3">"{appt.notes}"</p>
                          ) : (
                            <p className="text-xs font-bold text-black/40 italic">Sin notas para esta cita.</p>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                 <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <Clock className="w-12 h-12 text-gray-300" />
                 </div>
                 <p className="text-lg font-bold text-black mb-1">Sin historial disponible</p>
                 <p className="text-sm font-bold text-black/50">Este paciente aún no ha tenido citas registradas.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
