from datetime import UTC, datetime

import pytest

from app.services.periods import InvalidPeriodError, build_window


def test_invalid_period():
    with pytest.raises(InvalidPeriodError):
        build_window("14d")


def test_invalid_timezone():
    with pytest.raises(InvalidPeriodError):
        build_window("7d", "Mars/Olympus")


def test_window_starts_at_local_midnight():
    now = datetime(2026, 11, 8, 3, 0, tzinfo=UTC)  # still Nov 7 in Chicago
    window = build_window("7d", "America/Chicago", now)
    assert str(window.today) == "2026-11-07"
    assert str(window.start_date) == "2026-11-01"
    # Nov 1 2026 is a DST change day in Chicago; midnight is CDT (UTC-5).
    assert window.start == datetime(2026, 11, 1, 5, 0, tzinfo=UTC)
    assert window.end == now
