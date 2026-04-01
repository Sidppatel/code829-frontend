import dayjs from 'dayjs';

export const formatEventDate = (iso: string): string => {
  const d = dayjs(iso);
  if (!d.isValid()) return '';
  return d.format('ddd, MMM D, YYYY [at] h:mm A');
};

export const formatDateRange = (start: string, end: string): string => {
  const s = dayjs(start);
  const e = dayjs(end);
  if (!s.isValid()) return '';
  if (!e.isValid()) return formatEventDate(start);

  if (s.isSame(e, 'day')) {
    return `${s.format('ddd, MMM D, YYYY')} ${s.format('h:mm A')} \u2013 ${e.format('h:mm A')}`;
  }

  return `${s.format('ddd, MMM D, h:mm A')} \u2013 ${e.format('ddd, MMM D, h:mm A')}`;
};
