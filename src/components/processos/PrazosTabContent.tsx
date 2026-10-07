import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Table,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Plus,
  Scale,
  CalendarDays,
  User,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Processo,
  Pericia,
  Nomeacao,
  OrdemDeServico,
  Tarefa,
  ItemPrazo,
  Usuario,
} from '../../types';
import {
  calcularDiasUteisRestantes,
  toIsoDate,
  parseIsoDate,
  verificarDiaUtil,
} from '../../utils/calculadoraPrazos';
import { formatDate, formatProcesso } from '../../utils/formatters';

interface PrazosTabContentProps {
  processos: Processo[];
  pericias: Pericia[];
  nomeacoes: Nomeacao[];
  ordensDeServico: OrdemDeServico[];
  tarefas: Tarefa[];
  usuarios: Usuario[];
  onSelectProcesso: (processo: Processo) => void;
  onAbrirCalculadora: (proc?: Processo) => void;
  onConcluirPrazo?: (item: ItemPrazo) => void;
}

export const PrazosTabContent: React.FC<PrazosTabContentProps> = ({
  processos,
  pericias,
  nomeacoes,
  ordensDeServico,
  tarefas,
  usuarios,
  onSelectProcesso,
  onAbrirCalculadora,
  onConcluirPrazo,
}) => {
  const [viewMode, setViewMode] = useState<'tabela' | 'calendario'>('tabela');
  const [filtroSemaforo, setFiltroSemaforo] = useState<'todos' | 'vencido' | 'alerta_3_dias' | 'ok'>('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [diaSelecionadoCalendario, setDiaSelecionadoCalendario] = useState<string | null>(null);

  const hoje = toIsoDate(new Date());

  // Consolidar todos os prazos em uma lista unificada ItemPrazo
  const todosOsPrazos: ItemPrazo[] = useMemo(() => {
    const itens: ItemPrazo[] = [];

    // 1. Marcos do CPC dos Processos
    processos.forEach((p) => {
      if (p.marcosCpc && p.marcosCpc.length > 0) {
        p.marcosCpc.forEach((m) => {
          if (m.dataLimite && m.status !== 'Concluído') {
            const statusCalc = calcularDiasUteisRestantes(m.dataLimite, hoje, p.comarca);
            const user = usuarios.find((u) => u.id === p.responsavelId);

            itens.push({
              id: `${p.id}_${m.id}`,
              processoId: p.id,
              numeroCnj: p.numeroCnj,
              titulo: `${m.nome} (${m.artigoCpc})`,
              tipo: 'Marco CPC',
              artigoCpc: m.artigoCpc,
              dataLimite: m.dataLimite,
              dataLimiteFormatada: formatDate(m.dataLimite),
              diasRestantesUteis: statusCalc.diasUteisRestantes,
              semaforo: statusCalc.semaforo,
              responsavelId: p.responsavelId || 'user_karine',
              responsavelNome: user?.nome || 'Dra. Karine Reis',
              concluido: false,
              comarca: p.comarca,
            });
          }
        });
      } else if (p.proximaDataImportante) {
        const statusCalc = calcularDiasUteisRestantes(p.proximaDataImportante, hoje, p.comarca);
        const user = usuarios.find((u) => u.id === p.responsavelId);

        itens.push({
          id: `${p.id}_prox`,
          processoId: p.id,
          numeroCnj: p.numeroCnj,
          titulo: `Prazo Processual - ${p.statusProcessual}`,
          tipo: 'Marco CPC',
          dataLimite: p.proximaDataImportante.slice(0, 10),
          dataLimiteFormatada: formatDate(p.proximaDataImportante),
          diasRestantesUteis: statusCalc.diasUteisRestantes,
          semaforo: statusCalc.semaforo,
          responsavelId: p.responsavelId || 'user_karine',
          responsavelNome: user?.nome || 'Dra. Karine Reis',
          concluido: false,
          comarca: p.comarca,
        });
      }
    });

    // 2. Ordens de Serviço
    ordensDeServico.forEach((os) => {
      if (os.status !== 'Finalizada' && os.dataPrevisaoEntrega) {
        const proc = processos.find((p) => p.id === os.processoId);
        const statusCalc = calcularDiasUteisRestantes(os.dataPrevisaoEntrega, hoje, proc?.comarca);
        const user = usuarios.find((u) => u.id === os.responsavelId);

        itens.push({
          id: os.id,
          processoId: os.processoId,
          numeroCnj: proc?.numeroCnj || 'Processo s/ número',
          titulo: `OS: ${os.tipo} (${os.titulo || ''})`,
          tipo: 'Ordem de Serviço',
          dataLimite: os.dataPrevisaoEntrega,
          dataLimiteFormatada: formatDate(os.dataPrevisaoEntrega),
          diasRestantesUteis: statusCalc.diasUteisRestantes,
          semaforo: statusCalc.semaforo,
          responsavelId: os.responsavelId,
          responsavelNome: user?.nome || 'Equipe Técnica',
          concluido: false,
          comarca: proc?.comarca || 'São Paulo',
        });
      }
    });

    // 3. Perícias Agendadas
    pericias.forEach((per) => {
      if (per.status === 'Agendada' && per.dataHora) {
        const proc = processos.find((p) => p.id === per.processoId);
        const dataDia = per.dataHora.slice(0, 10);
        const statusCalc = calcularDiasUteisRestantes(dataDia, hoje, proc?.comarca);
        const user = usuarios.find((u) => u.id === proc?.responsavelId);

        itens.push({
          id: per.id,
          processoId: per.processoId,
          numeroCnj: proc?.numeroCnj || 'Perícia Judicial',
          titulo: `Exame Médico Pericial (${per.modalidade} - ${per.tipoLocal})`,
          tipo: 'Perícia',
          dataLimite: dataDia,
          dataLimiteFormatada: formatDate(per.dataHora),
          diasRestantesUteis: statusCalc.diasUteisRestantes,
          semaforo: statusCalc.semaforo,
          responsavelId: proc?.responsavelId || 'user_karine',
          responsavelNome: user?.nome || 'Dra. Karine Reis',
          concluido: false,
          comarca: per.cidade,
        });
      }
    });

    // 4. Nomeações do Juízo (prazo de aceite)
    nomeacoes.forEach((nom) => {
      if (nom.status === 'Aguardando Aceite' && nom.dataLimiteAceite) {
        const proc = processos.find((p) => p.id === nom.processoId);
        const statusCalc = calcularDiasUteisRestantes(nom.dataLimiteAceite, hoje, nom.comarca);

        itens.push({
          id: nom.id,
          processoId: nom.processoId,
          numeroCnj: proc?.numeroCnj || `Nomeação ${nom.vara}`,
          titulo: `Aceite da Nomeação Pericial - Art. 465 (${nom.vara})`,
          tipo: 'Nomeação',
          artigoCpc: 'Art. 465 caput (5 dias)',
          dataLimite: nom.dataLimiteAceite,
          dataLimiteFormatada: formatDate(nom.dataLimiteAceite),
          diasRestantesUteis: statusCalc.diasUteisRestantes,
          semaforo: statusCalc.semaforo,
          responsavelId: 'user_karine',
          responsavelNome: 'Dra. Karine Reis',
          concluido: false,
          comarca: nom.comarca,
        });
      }
    });

    // Ordenar por data limite crescente (mais urgentes e vencidos primeiro)
    return itens.sort((a, b) => a.dataLimite.localeCompare(b.dataLimite));
  }, [processos, ordensDeServico, pericias, nomeacoes, usuarios, hoje]);

  // Contadores para os badges do Semáforo
  const contadores = useMemo(() => {
    return {
      total: todosOsPrazos.length,
      vencido: todosOsPrazos.filter((p) => p.semaforo === 'vencido').length,
      alerta_3_dias: todosOsPrazos.filter((p) => p.semaforo === 'alerta_3_dias').length,
      ok: todosOsPrazos.filter((p) => p.semaforo === 'ok').length,
    };
  }, [todosOsPrazos]);

  // Prazos Filtrados
  const prazosFiltrados = useMemo(() => {
    return todosOsPrazos.filter((p) => {
      const matchSemaforo = filtroSemaforo === 'todos' || p.semaforo === filtroSemaforo;
      const matchResp = filtroResponsavel === 'todos' || p.responsavelId === filtroResponsavel;
      const matchTipo = filtroTipo === 'todos' || p.tipo === filtroTipo;
      const matchBusca =
        p.numeroCnj.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.responsavelNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.comarca.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSemaforo && matchResp && matchTipo && matchBusca;
    });
  }, [todosOsPrazos, filtroSemaforo, filtroResponsavel, filtroTipo, searchTerm]);

  // Geração dos próximos 30 dias para a visão de Calendário
  const proximos30Dias = useMemo(() => {
    const dias: { data: string; dateObj: Date; util: boolean; motivo?: string; prazosDoDia: ItemPrazo[] }[] = [];
    const inicio = new Date();

    for (let i = 0; i < 30; i++) {
      const cursor = new Date(inicio);
      cursor.setDate(cursor.getDate() + i);
      const iso = toIsoDate(cursor);
      const checkUtil = verificarDiaUtil(cursor, 'São Paulo');
      const prazosDoDia = todosOsPrazos.filter((p) => p.dataLimite === iso);

      dias.push({
        data: iso,
        dateObj: cursor,
        util: checkUtil.util,
        motivo: checkUtil.motivo,
        prazosDoDia,
      });
    }
    return dias;
  }, [todosOsPrazos]);

  const renderBadgeSemaforo = (semaforo: ItemPrazo['semaforo'], dias: number) => {
    if (semaforo === 'vencido') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/50">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Vencido ({Math.abs(dias)}d úteis)
        </span>
      );
    }
    if (semaforo === 'alerta_3_dias') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/50">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {dias === 0 ? 'Vence HOJE' : `Até ${dias} dias úteis`}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        OK ({dias}d úteis)
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Banner Semáforo & Controles Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Total */}
        <div
          onClick={() => setFiltroSemaforo('todos')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroSemaforo === 'todos'
              ? 'bg-[#1b222d] border-[#b8a47c] shadow-md'
              : 'bg-[#12171f] border-[#1b222d] hover:border-[#263040]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#545c6b]">Todos os Prazos Ativos</span>
            <CalendarDays className="w-4 h-4 text-[#5b9cd9]" />
          </div>
          <div className="text-2xl font-bold font-serif text-[#f4efe3] mt-1">
            {contadores.total}
          </div>
          <span className="text-[10px] text-[#545c6b]">Próximos 30 dias sob controle</span>
        </div>

        {/* Card 2: Vencidos (Vermelho) */}
        <div
          onClick={() => setFiltroSemaforo('vencido')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroSemaforo === 'vencido'
              ? 'bg-rose-950/30 border-rose-600 shadow-md'
              : 'bg-[#12171f] border-[#1b222d] hover:border-rose-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              🔴 Vencidos
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-rose-300 mt-1">
            {contadores.vencido}
          </div>
          <span className="text-[10px] text-rose-400/80">Necessitam protocolo imediato</span>
        </div>

        {/* Card 3: Até 3 dias úteis (Amarelo) */}
        <div
          onClick={() => setFiltroSemaforo('alerta_3_dias')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroSemaforo === 'alerta_3_dias'
              ? 'bg-amber-950/30 border-amber-600 shadow-md'
              : 'bg-[#12171f] border-[#1b222d] hover:border-amber-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              🟡 Até 3 Dias Úteis
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-200 mt-1">
            {contadores.alerta_3_dias}
          </div>
          <span className="text-[10px] text-amber-400/80">Risco iminente de preclusão</span>
        </div>

        {/* Card 4: OK (Verde) */}
        <div
          onClick={() => setFiltroSemaforo('ok')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filtroSemaforo === 'ok'
              ? 'bg-emerald-950/30 border-emerald-600 shadow-md'
              : 'bg-[#12171f] border-[#1b222d] hover:border-emerald-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              🟢 Prazos Regulares (&gt; 3d)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-300 mt-1">
            {contadores.ok}
          </div>
          <span className="text-[10px] text-emerald-400/80">Elaboração em andamento regular</span>
        </div>
      </div>

      {/* Barra de Filtros e Alternância de Modo (Tabela / Calendário) */}
      <div className="p-4 rounded-xl bg-[#12171f] border border-[#1b222d] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Alternância Tabela vs Calendário */}
          <div className="flex rounded-lg bg-[#1b222d] p-1 border border-[#263040]">
            <button
              onClick={() => setViewMode('tabela')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'tabela'
                  ? 'bg-[#263040] text-[#b8a47c] shadow-sm'
                  : 'text-[#545c6b] hover:text-[#f4efe3]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Tabela de Prazos
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'calendario'
                  ? 'bg-[#263040] text-[#b8a47c] shadow-sm'
                  : 'text-[#545c6b] hover:text-[#f4efe3]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendário 30 Dias
            </button>
          </div>

          {/* Busca */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#545c6b] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por CNJ, tipo ou parte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1b222d] border border-[#263040] rounded-lg pl-8 pr-3 py-1.5 text-[#f4efe3] placeholder-[#545c6b] focus:outline-none focus:border-[#b8a47c]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Filtro por Responsável */}
          <select
            value={filtroResponsavel}
            onChange={(e) => setFiltroResponsavel(e.target.value)}
            className="bg-[#1b222d] border border-[#263040] rounded-lg px-2.5 py-1.5 text-[#f4efe3] focus:outline-none text-xs"
          >
            <option value="todos">Todos os Responsáveis</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Tipo de Prazo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-[#1b222d] border border-[#263040] rounded-lg px-2.5 py-1.5 text-[#f4efe3] focus:outline-none text-xs"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="Marco CPC">Marcos do CPC</option>
            <option value="Ordem de Serviço">Ordens de Serviço</option>
            <option value="Perícia">Perícias Agendadas</option>
            <option value="Nomeação">Nomeações do Juízo</option>
          </select>

          {/* Botão Abrir Calculadora Independente */}
          <button
            onClick={() => onAbrirCalculadora()}
            className="px-3.5 py-1.5 rounded-lg bg-[#b8a47c]/15 text-[#b8a47c] border border-[#b8a47c]/40 font-semibold text-xs hover:bg-[#b8a47c]/25 transition-colors flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            Calculadora CPC
          </button>
        </div>
      </div>

      {/* MODO 1: TABELA DE PRAZOS */}
      {viewMode === 'tabela' && (
        <div className="rounded-xl border border-[#1b222d] overflow-hidden bg-[#12171f] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161c26] text-[#b8a47c] border-b border-[#263040] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Semáforo</th>
                  <th className="py-3 px-4">Data Fatal</th>
                  <th className="py-3 px-4">Dias Restantes</th>
                  <th className="py-3 px-4">Processo (CNJ)</th>
                  <th className="py-3 px-4">Tipo / Marco Legal</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b222d]">
                {prazosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#545c6b]">
                      Nenhum prazo encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  prazosFiltrados.map((item) => {
                    const proc = processos.find((p) => p.id === item.processoId);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#161c26]/60 transition-colors ${
                          item.semaforo === 'vencido'
                            ? 'bg-rose-950/15'
                            : item.semaforo === 'alerta_3_dias'
                            ? 'bg-amber-950/15'
                            : ''
                        }`}
                      >
                        {/* Semáforo */}
                        <td className="py-3 px-4">
                          {renderBadgeSemaforo(item.semaforo, item.diasRestantesUteis)}
                        </td>

                        {/* Data Fatal */}
                        <td className="py-3 px-4 font-mono font-semibold text-[#f4efe3]">
                          {formatDate(item.dataLimite)}
                        </td>

                        {/* Dias Úteis Restantes */}
                        <td className="py-3 px-4 font-semibold">
                          {item.semaforo === 'vencido' ? (
                            <span className="text-rose-400">
                              -{Math.abs(item.diasRestantesUteis)} dias úteis
                            </span>
                          ) : item.diasRestantesUteis === 0 ? (
                            <span className="text-amber-400 font-bold">Hoje</span>
                          ) : (
                            <span className={item.diasRestantesUteis <= 3 ? 'text-amber-300' : 'text-emerald-400'}>
                              {item.diasRestantesUteis} dias úteis
                            </span>
                          )}
                        </td>

                        {/* Processo CNJ */}
                        <td className="py-3 px-4">
                          {proc ? (
                            <button
                              onClick={() => onSelectProcesso(proc)}
                              className="font-mono text-[#5b9cd9] hover:underline text-left block font-medium"
                            >
                              {formatProcesso(proc.numeroCnj)}
                            </button>
                          ) : (
                            <span className="font-mono text-[#545c6b]">{item.numeroCnj}</span>
                          )}
                          <div className="text-[10px] text-[#545c6b]">
                            {item.comarca}
                          </div>
                        </td>

                        {/* Tipo / Título */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="text-[#f4efe3] font-medium block truncate">
                            {item.titulo}
                          </span>
                          <span className="text-[10px] text-[#545c6b]">{item.tipo}</span>
                        </td>

                        {/* Responsável */}
                        <td className="py-3 px-4 text-[#e8e1d0]">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#b8a47c]" />
                            <span>{item.responsavelNome}</span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {proc && (
                              <button
                                onClick={() => onSelectProcesso(proc)}
                                className="px-2.5 py-1 rounded bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#b8a47c] text-[11px] font-medium transition-colors"
                              >
                                Ver Ficha →
                              </button>
                            )}
                            <button
                              onClick={() => onAbrirCalculadora(proc)}
                              title="Simular na Calculadora CPC"
                              className="p-1 rounded bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#545c6b] hover:text-[#f4efe3]"
                            >
                              <Scale className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODO 2: CALENDÁRIO DOS PRÓXIMOS 30 DIAS COM SEMÁFORO */}
      {viewMode === 'calendario' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#12171f] border border-[#1b222d] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#b8a47c]" />
              <span className="font-semibold text-[#f4efe3]">
                Grade Diária dos Próximos 30 Dias (Contagem Oficial CPC/2015)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Vencido
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Até 3 dias
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Regular
              </span>
              <span className="flex items-center gap-1 text-[#545c6b]">
                <span className="w-2 h-2 rounded-full bg-[#323d4f]" /> Suspenso / Feriado
              </span>
            </div>
          </div>

          {/* Grid de 30 dias */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {proximos30Dias.map((item) => {
              const temPrazos = item.prazosDoDia.length > 0;
              const temVencido = item.prazosDoDia.some((p) => p.semaforo === 'vencido');
              const temAlerta = item.prazosDoDia.some((p) => p.semaforo === 'alerta_3_dias');
              const isHoje = item.data === hoje;

              const borderClass = temVencido
                ? 'border-rose-700 bg-rose-950/20'
                : temAlerta
                ? 'border-amber-700 bg-amber-950/20'
                : temPrazos
                ? 'border-emerald-700 bg-emerald-950/20'
                : isHoje
                ? 'border-[#b8a47c] bg-[#1b222d]'
                : !item.util
                ? 'border-[#1b222d] bg-[#0c1017] opacity-60'
                : 'border-[#1b222d] bg-[#12171f]';

              return (
                <div
                  key={item.data}
                  onClick={() => setDiaSelecionadoCalendario(item.data)}
                  className={`p-3 rounded-xl border flex flex-col justify-between min-h-[110px] cursor-pointer hover:border-[#b8a47c]/60 transition-all ${borderClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-sm font-bold font-mono ${isHoje ? 'text-[#b8a47c]' : 'text-[#f4efe3]'}`}>
                        {item.dateObj.getDate().toString().padStart(2, '0')}/
                        {(item.dateObj.getMonth() + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-[#545c6b] block">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][item.dateObj.getDay()]}
                      </span>
                    </div>

                    {!item.util ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1b222d] text-[#545c6b] border border-[#263040]">
                        Suspenso
                      </span>
                    ) : temPrazos ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          temVencido
                            ? 'bg-rose-500 text-white'
                            : temAlerta
                            ? 'bg-amber-500 text-black'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {item.prazosDoDia.length}
                      </span>
                    ) : null}
                  </div>

                  {/* Lista Resumida dos Prazos do Dia */}
                  <div className="space-y-1 mt-2">
                    {item.prazosDoDia.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                          p.semaforo === 'vencido'
                            ? 'bg-rose-950/60 text-rose-300'
                            : p.semaforo === 'alerta_3_dias'
                            ? 'bg-amber-950/60 text-amber-300'
                            : 'bg-emerald-950/60 text-emerald-300'
                        }`}
                        title={p.titulo}
                      >
                        {p.titulo}
                      </div>
                    ))}
                    {item.prazosDoDia.length > 2 && (
                      <span className="text-[9px] text-[#b8a47c] block text-right font-semibold">
                        +{item.prazosDoDia.length - 2} mais...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer / Detalhe do Dia Selecionado */}
          {diaSelecionadoCalendario && (
            <div className="p-4 rounded-xl bg-[#161c26] border border-[#263040] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#b8a47c]" />
                  <span className="font-serif text-sm font-semibold text-[#f4efe3]">
                    Prazos Fatais em {formatDate(diaSelecionadoCalendario)}:
                  </span>
                </div>
                <button
                  onClick={() => setDiaSelecionadoCalendario(null)}
                  className="text-[#545c6b] hover:text-[#f4efe3]"
                >
                  ✕
                </button>
              </div>

              {todosOsPrazos.filter((p) => p.dataLimite === diaSelecionadoCalendario).length === 0 ? (
                <p className="text-xs text-[#545c6b]">Nenhum prazo judicial fixado para esta data.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todosOsPrazos
                    .filter((p) => p.dataLimite === diaSelecionadoCalendario)
                    .map((item) => {
                      const proc = processos.find((p) => p.id === item.processoId);

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-lg bg-[#12171f] border border-[#263040] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {renderBadgeSemaforo(item.semaforo, item.diasRestantesUteis)}
                              <span className="font-mono text-[#5b9cd9] font-medium">
                                {formatProcesso(item.numeroCnj)}
                              </span>
                            </div>
                            <div className="font-semibold text-[#f4efe3]">{item.titulo}</div>
                            <div className="text-[11px] text-[#545c6b]">
                              Responsável: {item.responsavelNome} • Comarca: {item.comarca}
                            </div>
                          </div>

                          {proc && (
                            <button
                              onClick={() => onSelectProcesso(proc)}
                              className="px-3 py-1.5 rounded bg-[#1b222d] hover:bg-[#232c3a] border border-[#263040] text-[#b8a47c] text-xs font-semibold shrink-0"
                            >
                              Ficha →
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
