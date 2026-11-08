"""Which activity signals each event source can provide.

A metric whose signal is not provided by any *active* source is reported as
"unavailable" rather than zero. Adding a future authorized integration means
declaring its signals here and adding it to ACTIVE_SOURCES once it is real.
"""

from typing import Literal

Signal = Literal["calls", "blocked", "answered", "returned", "reported", "messages"]
ALL_SIGNALS: frozenset[str] = frozenset({"calls", "blocked", "answered", "returned", "reported", "messages"})

SOURCE_LABELS: dict[str, str] = {
    "synthetic_demo": "Synthetic demo data",
    "authorized_external_integration": "T-Mobile Scam Shield (authorized integration)",
    "user_submitted": "User-submitted reports",
}

SOURCE_SIGNALS: dict[str, frozenset[str]] = {
    # The demo generator simulates every signal an authorized integration might provide.
    "synthetic_demo": ALL_SIGNALS,
    # No authorized integration exists. Nothing is assumed to be available.
    "authorized_external_integration": frozenset(),
    "user_submitted": frozenset({"reported"}),
}

# Sources currently feeding CloseGuard. Only synthetic data for the hackathon demo.
ACTIVE_SOURCES: tuple[str, ...] = ("synthetic_demo",)


def available_signals(active_sources: tuple[str, ...] = ACTIVE_SOURCES) -> frozenset[str]:
    signals: set[str] = set()
    for source in active_sources:
        signals |= SOURCE_SIGNALS.get(source, frozenset())
    return frozenset(signals)


def data_sources(active_sources: tuple[str, ...] = ACTIVE_SOURCES) -> list[dict[str, str]]:
    """Status of each known source, for the synthetic-data disclosure in the UI."""
    return [
        {"source": source, "label": label, "status": "active" if source in active_sources else "not_connected"}
        for source, label in SOURCE_LABELS.items()
        if source != "user_submitted"
    ]
