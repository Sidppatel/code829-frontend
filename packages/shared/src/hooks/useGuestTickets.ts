import { useGuestTicketsQuery } from '../queries/tickets';
import type { GuestTicket } from '../types/ticket';

export interface UseGuestTicketsResult {
  tickets: GuestTicket[];
  error: boolean;
  loading: boolean;
  refresh: () => void;
}

export function useGuestTickets(): UseGuestTicketsResult {
  const q = useGuestTicketsQuery();
  return {
    tickets: q.data ?? [],
    error: q.isError,
    loading: q.isPending,
    refresh: () => void q.refetch(),
  };
}
