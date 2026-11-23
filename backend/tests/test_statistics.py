import pytest

from app.analysis.statistics import (
    correlation_analysis,
    descriptive_statistics,
    paired_task_time_test,
)


def test_descriptive_statistics_reports_missing_and_sample_standard_deviation():
    result = descriptive_statistics([1, 2, None, 4])
    assert result["n"] == 3
    assert result["missing"] == 1
    assert result["mean"] == pytest.approx(7 / 3)
    assert result["median"] == 2
    assert result["standard_deviation"] == pytest.approx(1.527525)
    assert sum(result["percentages"].values()) == pytest.approx(100)


def test_descriptive_statistics_empty_input_is_explicit():
    result = descriptive_statistics([None, None])
    assert result["n"] == 0
    assert result["missing"] == 2
    assert result["mean"] is None


def test_spearman_correlation_handles_missing_pairs():
    result = correlation_analysis([1, 2, 3, None, 5], [2, 4, 6, 8, 10])
    assert result["method"] == "spearman"
    assert result["n"] == 4
    assert result["coefficient"] == pytest.approx(1)


def test_correlation_rejects_mismatched_and_insufficient_data():
    with pytest.raises(ValueError, match="same number"):
        correlation_analysis([1, 2], [1])
    with pytest.raises(ValueError, match="three complete"):
        correlation_analysis([1, 2], [1, None])


def test_paired_task_time_test_reports_testable_hypotheses():
    result = paired_task_time_test([12, 10, 15, 11], [10, 9, 12, 9])
    assert result["test"] == "paired_t_test"
    assert result["n"] == 4
    assert result["reject_null"] is True
    assert result["confidence_interval_95"][1] < 0


def test_paired_task_time_test_validates_pairing_and_alpha():
    with pytest.raises(ValueError, match="paired"):
        paired_task_time_test([1, 2], [1])
    with pytest.raises(ValueError, match="alpha"):
        paired_task_time_test([1, 2], [1, 2], alpha=1)
