export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const isNowBetween = (start, end, now = new Date()) => {
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= toMinutes(start) && mins <= toMinutes(end);
};

export const todayDayOfWeek = (now = new Date()) => {
  // JS getDay: 0=Sun..6=Sat -> we will use 1=Mon..7=Sun or keep 0..6. Our data used 5 for Friday, assuming 5=Friday in 0=Sun mapping -> 5=Friday ok.
  return now.getDay();
};
