// TODO: backend - Integração com Google Calendar API / Microsoft Graph Calendar

export interface EventoAgendaPayload {
  titulo: string;
  descricao: string;
  inicio: string;
  fim: string;
  local?: string;
  participantesEmails?: string[];
}

export const agendaAdapter = {
  async sincronizarComGoogleCalendar(evento: EventoAgendaPayload): Promise<{ sucesso: boolean; idExterno: string }> {
    // TODO: backend - chamada POST /api/integrations/calendar/sync
    await new Promise((res) => setTimeout(res, 400));
    return {
      sucesso: true,
      idExterno: `gcal_${Date.now()}`,
    };
  },

  gerarLinkGoogleCalendar(evento: EventoAgendaPayload): string {
    const startIso = evento.inicio.replace(/-|:|\.\d\d\d/g, '');
    const endIso = evento.fim.replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      evento.titulo
    )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(evento.descricao)}&location=${encodeURIComponent(
      evento.local || ''
    )}`;
  }
};
