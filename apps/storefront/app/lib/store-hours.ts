export type StoreAvailabilityMode = 'open' | 'after_hours' | 'closed' | 'maintenance';

type StoreLocalDate = {
  year: number;
  month: number;
  day: number;
};

type StoreLocalDateTime = StoreLocalDate & {
  hour: number;
  minute: number;
};

export type StoreAvailability = {
  mode: StoreAvailabilityMode;
  timeZone: string;
  openingTime: string;
  closingTime: string;
  openingMinutes: number;
  closingMinutes: number;
  currentMinutes: number;
  withinSchedule: boolean;
  nextOpenAt: Date;
};

export type ScheduledOrderResolution =
  | {
      valid: true;
      scheduledFor: Date;
      timeZone: string;
      normalizedTime: string;
    }
  | {
      valid: false;
      reason: 'invalid_format' | 'outside_window' | 'no_future_slot' | 'ordering_unavailable';
      timeZone: string;
    };

const DEFAULT_TIME_ZONE = 'Asia/Kolkata';
const DEFAULT_OPENING_TIME = '11:00';
const DEFAULT_CLOSING_TIME = '23:00';

function normalizeTimeValue(value: string, fallback: string) {
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : fallback;
}

function parseClockMinutes(value: string) {
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatClockMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseOffsetMinutes(offsetLabel: string) {
  const normalized = offsetLabel.replace('GMT', '').trim();
  if (!normalized) return 0;

  const sign = normalized.startsWith('-') ? -1 : 1;
  const value = normalized.replace(/^[-+]/, '');
  const [hoursPart, minutesPart = '0'] = value.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return sign * (hours * 60 + minutes);
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
  });

  const offsetLabel = formatter.formatToParts(date).find((part) => part.type === 'timeZoneName')?.value;
  return parseOffsetMinutes(offsetLabel || 'GMT');
}

function getStoreLocalDateTime(now: Date, timeZone: string): StoreLocalDateTime {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => Number(parts.find((part) => part.type === type)?.value || '0');

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  };
}

function addDaysToStoreDate(date: StoreLocalDate, days: number): StoreLocalDate {
  const utcDate = new Date(Date.UTC(date.year, date.month - 1, date.day + days, 12, 0, 0, 0));
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function storeLocalDateTimeToUtc(date: StoreLocalDate, totalMinutes: number, timeZone: string) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const approximateUtc = new Date(Date.UTC(date.year, date.month - 1, date.day, hours, minutes, 0, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(approximateUtc, timeZone);
  return new Date(approximateUtc.getTime() - offsetMinutes * 60 * 1000);
}

export function isTimeWithinWindow(currentMinutes: number, openingMinutes: number, closingMinutes: number) {
  if (openingMinutes === closingMinutes) return true;
  if (openingMinutes < closingMinutes) {
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  }
  return currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
}

export function getStoreTimeZoneFromConfig(config: Record<string, string>) {
  const candidate = config.store_timezone?.trim() || DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function getOpeningMinutes(config: Record<string, string>) {
  return parseClockMinutes(normalizeTimeValue(config.opening_time || '', DEFAULT_OPENING_TIME)) ?? 11 * 60;
}

function getClosingMinutes(config: Record<string, string>) {
  return parseClockMinutes(normalizeTimeValue(config.closing_time || '', DEFAULT_CLOSING_TIME)) ?? 23 * 60;
}

export function getStoreAvailabilityFromConfig(config: Record<string, string>, now = new Date()): StoreAvailability {
  const timeZone = getStoreTimeZoneFromConfig(config);
  const openingTime = normalizeTimeValue(config.opening_time || '', DEFAULT_OPENING_TIME);
  const closingTime = normalizeTimeValue(config.closing_time || '', DEFAULT_CLOSING_TIME);
  const openingMinutes = getOpeningMinutes(config);
  const closingMinutes = getClosingMinutes(config);
  const localNow = getStoreLocalDateTime(now, timeZone);
  const currentMinutes = localNow.hour * 60 + localNow.minute;
  const withinSchedule = isTimeWithinWindow(currentMinutes, openingMinutes, closingMinutes);
  const maintenanceMode = config.site_maintenance_mode === 'true';
  const adminOpen = config.is_open !== 'false';

  let mode: StoreAvailabilityMode;
  if (maintenanceMode) {
    mode = 'maintenance';
  } else if (!adminOpen) {
    mode = 'closed';
  } else if (withinSchedule) {
    mode = 'open';
  } else {
    mode = 'after_hours';
  }

  let nextOpenAt = storeLocalDateTimeToUtc(localNow, openingMinutes, timeZone);
  if (nextOpenAt.getTime() <= now.getTime()) {
    nextOpenAt = storeLocalDateTimeToUtc(addDaysToStoreDate(localNow, 1), openingMinutes, timeZone);
  }

  return {
    mode,
    timeZone,
    openingTime,
    closingTime,
    openingMinutes,
    closingMinutes,
    currentMinutes,
    withinSchedule,
    nextOpenAt,
  };
}

export function getDefaultScheduledTimeValue(config: Record<string, string>, now = new Date()) {
  const availability = getStoreAvailabilityFromConfig(config, now);
  return formatClockMinutes(availability.openingMinutes);
}

export function resolveScheduledOrderTime(
  config: Record<string, string>,
  requestedTime: string,
  now = new Date()
): ScheduledOrderResolution {
  const availability = getStoreAvailabilityFromConfig(config, now);
  const normalizedTime = normalizeTimeValue(requestedTime, '');
  const requestedMinutes = parseClockMinutes(normalizedTime);

  if (availability.mode === 'closed' || availability.mode === 'maintenance') {
    return {
      valid: false,
      reason: 'ordering_unavailable',
      timeZone: availability.timeZone,
    };
  }

  if (requestedMinutes === null) {
    return {
      valid: false,
      reason: 'invalid_format',
      timeZone: availability.timeZone,
    };
  }

  if (!isTimeWithinWindow(requestedMinutes, availability.openingMinutes, availability.closingMinutes)) {
    return {
      valid: false,
      reason: 'outside_window',
      timeZone: availability.timeZone,
    };
  }

  const localNow = getStoreLocalDateTime(now, availability.timeZone);

  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const localDate = addDaysToStoreDate(localNow, dayOffset);
    const candidate = storeLocalDateTimeToUtc(localDate, requestedMinutes, availability.timeZone);

    if (candidate.getTime() > now.getTime() + 60 * 1000) {
      return {
        valid: true,
        scheduledFor: candidate,
        timeZone: availability.timeZone,
        normalizedTime: formatClockMinutes(requestedMinutes),
      };
    }
  }

  return {
    valid: false,
    reason: 'no_future_slot',
    timeZone: availability.timeZone,
  };
}

export function formatStoreDateTime(value: Date | string, timeZone: string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
