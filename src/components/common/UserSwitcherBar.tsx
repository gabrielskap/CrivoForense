import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ShieldAlert, Users, ArrowRightLeft, Lock, Unlock } from 'lucide-react';

export const UserSwitcherBar: React.FC = () => {
  const { currentUser, currentRole, allUsers, switchUser, canAccessSensitiveHealthData } = useAuth();
  const hasHealthAccess = canAccessSensitiveHealthData();

  return (
    <div className="bg-[#12171f] border-b border-[#263040] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1b222d] border border-[#263040] text-[#e8e1d0]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentUser.corAgenda || '#b8a47c' }} />
          <span className="font-semibold text-[#f4efe3]">{currentUser.nome}</span>
          <span className="text-[#545c6b]">•</span>
          <span className="text-[#b8a47c] font-medium">{currentRole.nome}</span>
        </div>

        {/* Sensitive health data badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
            hasHealthAccess
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
          }`}
          title={
            hasHealthAccess
              ? 'Perfil autorizado a acessar prontuários e dados clínicos sensíveis (LGPD Art. 11)'
              : 'Acesso a prontuários e dados de saúde de periciandos bloqueado por perfil'
          }
        >
          {hasHealthAccess ? (
            <>
              <Unlock className="w-3 h-3 text-emerald-400" />
              <span>LGPD Saúde: Liberado</span>
            </>
          ) : (
            <>
              <Lock className="w-3 h-3 text-rose-400" />
              <span>LGPD Saúde: Bloqueado</span>
            </>
          )}
        </div>
      </div>

      {/* Quick user toggle pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="text-[11px] text-[#545c6b] hidden sm:inline mr-1 flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3 text-[#b8a47c]" />
          Simular usuário:
        </span>
        {allUsers.map((user) => {
          const isSelected = user.id === currentUser.id;
          return (
            <button
              key={user.id}
              onClick={() => switchUser(user.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? 'bg-[#b8a47c] text-[#0a0e14] font-semibold shadow-sm'
                  : 'bg-[#1b222d] text-[#e8e1d0]/80 hover:text-[#f4efe3] hover:bg-[#232c3a] border border-[#263040]'
              }`}
              title={`Trocar para ${user.nome} (${user.papelNome})`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: user.corAgenda }}
              />
              <span>{user.nome.split(' ')[0]}</span>
              <span className={`text-[10px] ${isSelected ? 'text-[#0a0e14]/80' : 'text-[#545c6b]'}`}>
                ({user.papelNome.split('/')[0]})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
