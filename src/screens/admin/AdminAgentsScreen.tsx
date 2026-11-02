import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  Building2, 
  Users, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  FileText
} from 'lucide-react';

interface AgentAssignment {
  id: string;
  clientName: string;
  serviceType: 'Factory Audit' | 'Canton Fair VIP' | '1688 Sourcing';
  targetFactory: string;
  city: string;
  assignedAgent: string;
  scheduledDate: string;
  status: 'Assigned' | 'On-Site Inspection' | 'Report Generated' | 'Completed';
  step: number;
}

export const AdminAgentsScreen: React.FC = () => {
  const { showToast } = useApp();
  const [assignments, setAssignments] = useState<AgentAssignment[]>([
    {
      id: 'AGT-CAN-441',
      clientName: 'Chief Babatunde Alade',
      serviceType: 'Factory Audit',
      targetFactory: 'Guangzhou Shisanhang Apparel & Textile Mill',
      city: 'Guangzhou',
      assignedAgent: 'Zhang Wei (Bilingual Cantonese/English)',
      scheduledDate: '2026-11-10',
      status: 'On-Site Inspection',
      step: 1
    },
    {
      id: 'AGT-SZ-902',
      clientName: 'Alade Global Enterprises Ltd',
      serviceType: '1688 Sourcing',
      targetFactory: 'Shenzhen Kingzone Microelectronics Ltd',
      city: 'Shenzhen',
      assignedAgent: 'Chen Wei',
      scheduledDate: '2026-11-12',
      status: 'Assigned',
      step: 0
    }
  ]);

  const handleAdvanceStep = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStep = Math.min(3, a.step + 1);
          const nextStatus = nextStep === 1 ? 'On-Site Inspection' : nextStep === 2 ? 'Report Generated' : 'Completed';
          showToast(`Assignment #${id} updated to ${nextStatus}!`, 'success');
          return { ...a, step: nextStep, status: nextStatus };
        }
        return a;
      })
    );
  };

  return (
    <AdminLayout activeTab="agents">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Trade Agent & Factory Inspection Desk</h1>
            <p className="text-xs text-slate-400">
              Dispatch bilingual ground managers for Canton Fair escorts, factory audits, and cargo pre-shipment inspections.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-white text-xs">{assignment.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                        {assignment.serviceType}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{assignment.targetFactory}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                    {assignment.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{assignment.scheduledDate}</p>
                </div>
              </div>

              {/* Details & Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Client Requestor</span>
                  <span className="font-bold text-white">{assignment.clientName}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Hub City</span>
                  <span className="font-bold text-white">{assignment.city}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Assigned Ground Agent</span>
                  <span className="font-bold text-emerald-400">{assignment.assignedAgent}</span>
                </div>
              </div>

              {/* Progress Bar & Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Stage {assignment.step + 1} of 4:</span>
                  <span className="font-bold text-white">{assignment.status}</span>
                </div>

                {assignment.step < 3 && (
                  <button
                    onClick={() => handleAdvanceStep(assignment.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    Advance Milestone
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};
