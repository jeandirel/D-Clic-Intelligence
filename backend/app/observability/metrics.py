from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

FRESHSERVICE_REQUESTS = Counter(
    "dclic_freshservice_requests_total",
    "Freshservice HTTP requests",
    ["method", "endpoint", "status"],
)
FRESHSERVICE_LATENCY = Histogram(
    "dclic_freshservice_request_duration_seconds",
    "Freshservice request latency",
    ["method", "endpoint"],
)
FRESHSERVICE_429 = Counter(
    "dclic_freshservice_rate_limited_total",
    "Freshservice HTTP 429 responses",
)
FRESHSERVICE_REMAINING = Gauge(
    "dclic_freshservice_rate_limit_remaining",
    "Freshservice server-reported remaining account credits",
)
FRESHSERVICE_LOCAL_USAGE = Gauge(
    "dclic_freshservice_local_budget_usage",
    "D-Clic local Redis-backed Freshservice budget usage in the current minute",
)
ACTION_RESULTS = Counter(
    "dclic_action_results_total",
    "Governed action execution outcomes",
    ["status"],
)
POLICY_DECISIONS = Counter(
    "dclic_policy_decisions_total",
    "Policy decisions",
    ["decision", "policy_id"],
)


def metrics_payload() -> tuple[bytes, str]:
    return generate_latest(), CONTENT_TYPE_LATEST
