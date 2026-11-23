from collections import Counter
from math import isfinite, sqrt
from statistics import mean, median, mode, stdev
from typing import Any

from scipy import stats


def descriptive_statistics(values: list[float | int | None]) -> dict[str, Any]:
    observed = []
    for value in values:
        if value is None:
            continue
        number = float(value)
        if not isfinite(number):
            raise ValueError("values must be finite numbers or null values")
        observed.append(number)
    frequencies = Counter(observed)
    if not observed:
        return {
            "n": 0,
            "missing": len(values),
            "mean": None,
            "median": None,
            "mode": None,
            "minimum": None,
            "maximum": None,
            "range": None,
            "standard_deviation": None,
            "frequencies": {},
            "percentages": {},
        }

    top_count = max(frequencies.values())
    modes = sorted(value for value, count in frequencies.items() if count == top_count)
    counts = {str(value): count for value, count in sorted(frequencies.items())}
    percentages: dict[str, float] = {}
    assigned = 0.0
    for index, (key, count) in enumerate(counts.items()):
        percentage = (
            round(100.0 - assigned, 4)
            if index == len(counts) - 1
            else round(count / len(observed) * 100, 4)
        )
        percentages[key] = percentage
        assigned += percentage
    return {
        "n": len(observed),
        "missing": len(values) - len(observed),
        "mean": mean(observed),
        "median": median(observed),
        "mode": modes[0],
        "minimum": min(observed),
        "maximum": max(observed),
        "range": max(observed) - min(observed),
        "standard_deviation": stdev(observed) if len(observed) > 1 else None,
        "frequencies": counts,
        "percentages": percentages,
    }


def correlation_analysis(
    x: list[float | int | None],
    y: list[float | int | None],
    *,
    method: str = "spearman",
) -> dict[str, Any]:
    if len(x) != len(y):
        raise ValueError("Both variables must contain the same number of observations")
    if method not in {"pearson", "spearman"}:
        raise ValueError("method must be 'pearson' or 'spearman'")

    pairs = []
    for a, b in zip(x, y):
        if a is None or b is None:
            continue
        left, right = float(a), float(b)
        if not isfinite(left) or not isfinite(right):
            raise ValueError("correlation values must be finite numbers or null values")
        pairs.append((left, right))
    if len(pairs) < 3:
        raise ValueError("At least three complete pairs are required")
    left, right = zip(*pairs)
    if len(set(left)) < 2 or len(set(right)) < 2:
        raise ValueError("Correlation is undefined for a constant variable")

    result = stats.pearsonr(left, right) if method == "pearson" else stats.spearmanr(left, right)
    return {
        "variables": ["x", "y"],
        "method": method,
        "coefficient": float(result.statistic),
        "p_value": float(result.pvalue),
        "n": len(pairs),
        "interpretation_note": "Association does not establish causation.",
    }


def paired_task_time_test(
    before: list[float | int | None],
    after: list[float | int | None],
    *,
    alpha: float = 0.05,
) -> dict[str, Any]:
    if len(before) != len(after):
        raise ValueError("Before and after measurements must be paired and have equal length")
    if not 0 < alpha < 1:
        raise ValueError("alpha must be between 0 and 1")
    pairs = []
    for a, b in zip(before, after):
        if a is None or b is None:
            continue
        old, new = float(a), float(b)
        if not isfinite(old) or not isfinite(new):
            raise ValueError("paired measurements must be finite numbers or null values")
        pairs.append((old, new))
    if len(pairs) < 2:
        raise ValueError("At least two complete paired observations are required")

    before_values, after_values = zip(*pairs)
    differences = [new - old for old, new in pairs]
    if all(value == differences[0] for value in differences):
        if differences[0] == 0:
            statistic, p_value = 0.0, 1.0
        else:
            statistic, p_value = None, 0.0
    else:
        result = stats.ttest_rel(after_values, before_values)
        statistic, p_value = float(result.statistic), float(result.pvalue)

    avg_difference = mean(differences)
    sd_difference = stdev(differences) if len(differences) > 1 else 0.0
    critical = float(stats.t.ppf(1 - alpha / 2, len(differences) - 1))
    margin = critical * sd_difference / sqrt(len(differences))
    effect_size = avg_difference / sd_difference if sd_difference else None
    return {
        "test": "paired_t_test",
        "h0": "Mean paired task-time difference is zero.",
        "h1": "Mean paired task-time difference is not zero.",
        "alpha": alpha,
        "n": len(pairs),
        "mean_difference_after_minus_before": avg_difference,
        "test_statistic": statistic,
        "p_value": p_value,
        "confidence_interval_95": [avg_difference - margin, avg_difference + margin],
        "cohens_dz": effect_size,
        "reject_null": p_value < alpha,
        "assumptions": [
            "Measurements are paired for the same participants.",
            "Participants' paired differences are independent of one another.",
            "Paired differences are approximately normally distributed for the t-test.",
        ],
        "interpretation_note": "A statistical difference does not by itself establish usability or causation.",
    }
