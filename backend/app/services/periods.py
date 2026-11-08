"""Reporting periods, local-time windows and chart buckets."""

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, UTC
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

PERIOD_DAYS = {"7d": 7, "30d": 30, "90d": 90}
DEFAULT_PERIOD = "30d"


class InvalidPeriodError(ValueError):
    pass


@dataclass(frozen=True)
class Bucket:
    start_date: date  # local, inclusive
    end_date: date  # local, exclusive


@dataclass(frozen=True)
class Window:
    period: str
    days: int
    tz: ZoneInfo
    start: datetime  # UTC, inclusive (local midnight of the first day)
    end: datetime  # UTC, exclusive ("now")
    start_date: date
    today: date
    bucket_days: int
    buckets: tuple[Bucket, ...]

    def bucket_index(self, ts: datetime) -> int | None:
        local_day = ts.astimezone(self.tz).date()
        for i, bucket in enumerate(self.buckets):
            if bucket.start_date <= local_day < bucket.end_date:
                return i
        return None

    def contains(self, ts: datetime) -> bool:
        return self.start <= ts < self.end


def parse_timezone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(name or "UTC")
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise InvalidPeriodError(f"Unknown timezone: {name!r}.") from exc


def local_midnight(day: date, tz: ZoneInfo) -> datetime:
    return datetime.combine(day, time.min, tzinfo=tz).astimezone(UTC)


def build_window(period: str, tz_name: str | None = None, now: datetime | None = None) -> Window:
    if period not in PERIOD_DAYS:
        raise InvalidPeriodError(f"Unsupported period {period!r}. Use one of: {', '.join(PERIOD_DAYS)}.")
    tz = parse_timezone(tz_name)
    now = (now or datetime.now(UTC)).astimezone(UTC)
    days = PERIOD_DAYS[period]
    today = now.astimezone(tz).date()
    start_date = today - timedelta(days=days - 1)

    # Daily buckets for 7/30 days; weekly buckets (ending today) for 90 days.
    bucket_days = 1 if days <= 30 else 7
    buckets: list[Bucket] = []
    end_date = today + timedelta(days=1)
    while end_date > start_date:
        bucket_start = max(end_date - timedelta(days=bucket_days), start_date)
        buckets.append(Bucket(bucket_start, end_date))
        end_date = bucket_start
    buckets.reverse()

    return Window(
        period=period, days=days, tz=tz,
        start=local_midnight(start_date, tz), end=now,
        start_date=start_date, today=today,
        bucket_days=bucket_days, buckets=tuple(buckets),
    )
