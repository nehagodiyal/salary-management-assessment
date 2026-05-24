"""Verify the aggregation queries against a known fixture set.

`sample_dataset` salaries (from conftest):
  US/Eng/Sr Eng       150_000
  US/Eng/SWE          120_000
  US/Sales/AE         110_000
  Germany/Eng/SWE      90_000
  Germany/Sales/Mgr   100_000
  India/Eng/SWE        40_000
  India/HR/Recruiter   25_000
"""
import statistics


def test_empty_db_returns_none_for_stats(analytics_repo):
    assert analytics_repo.total_count() == 0
    assert analytics_repo.salary_avg() is None
    assert analytics_repo.salary_min() is None
    assert analytics_repo.salary_max() is None
    assert analytics_repo.salary_median() is None
    assert analytics_repo.top_paying_country() is None


def test_total_count(analytics_repo, sample_dataset):
    assert analytics_repo.total_count() == 7


def test_salary_min_max(analytics_repo, sample_dataset):
    assert analytics_repo.salary_min() == 25_000
    assert analytics_repo.salary_max() == 150_000


def test_salary_avg(analytics_repo, sample_dataset):
    expected = sum([150000, 120000, 110000, 90000, 100000, 40000, 25000]) / 7
    assert analytics_repo.salary_avg() == expected


def test_salary_median(analytics_repo, sample_dataset):
    expected = statistics.median([150000, 120000, 110000, 90000, 100000, 40000, 25000])
    assert analytics_repo.salary_median() == expected


def test_avg_salary_by_country(analytics_repo, sample_dataset):
    rows = {country: (avg, count) for country, avg, count in analytics_repo.avg_salary_by_country()}
    assert rows["United States"][1] == 3
    assert rows["Germany"][1] == 2
    assert rows["India"][1] == 2
    # US should be the highest.
    assert max(rows, key=lambda c: rows[c][0]) == "United States"


def test_avg_salary_by_job_title_orders_desc(analytics_repo, sample_dataset):
    rows = analytics_repo.avg_salary_by_job_title()
    averages = [avg for _, avg, _ in rows]
    assert averages == sorted(averages, reverse=True)


def test_avg_salary_by_department(analytics_repo, sample_dataset):
    rows = {dept: (avg, count) for dept, avg, count in analytics_repo.avg_salary_by_department()}
    assert rows["Engineering"][1] == 4
    assert rows["Sales"][1] == 2
    assert rows["HR"][1] == 1


def test_count_by_country(analytics_repo, sample_dataset):
    rows = dict(analytics_repo.count_by_country())
    assert rows == {"United States": 3, "Germany": 2, "India": 2}


def test_count_by_department(analytics_repo, sample_dataset):
    rows = dict(analytics_repo.count_by_department())
    assert rows == {"Engineering": 4, "Sales": 2, "HR": 1}


def test_top_paying_country_is_united_states(analytics_repo, sample_dataset):
    row = analytics_repo.top_paying_country()
    assert row is not None
    assert row[0] == "United States"


def test_top_paying_department_is_sales(analytics_repo, sample_dataset):
    # Sales avg = (110+100)/2 = 105_000; Engineering avg = (150+120+90+40)/4 = 100_000.
    row = analytics_repo.top_paying_department()
    assert row is not None
    assert row[0] == "Sales"


# ---------- Per-country salary stats ----------

def test_salary_stats_for_country_unknown_country_returns_zero(
    analytics_repo, sample_dataset
):
    count, minimum, maximum, average, median = (
        analytics_repo.salary_stats_for_country("Atlantis")
    )
    assert count == 0
    assert minimum is None
    assert maximum is None
    assert average is None
    assert median is None


def test_salary_stats_for_country_united_states(analytics_repo, sample_dataset):
    # US salaries in the fixture: 150_000, 120_000, 110_000
    count, minimum, maximum, average, median = (
        analytics_repo.salary_stats_for_country("United States")
    )
    assert count == 3
    assert minimum == 110_000
    assert maximum == 150_000
    assert average == (150_000 + 120_000 + 110_000) / 3
    assert median == 120_000


def test_salary_stats_for_country_india(analytics_repo, sample_dataset):
    # India salaries: 40_000, 25_000
    count, minimum, maximum, average, median = (
        analytics_repo.salary_stats_for_country("India")
    )
    assert count == 2
    assert minimum == 25_000
    assert maximum == 40_000
    assert average == (40_000 + 25_000) / 2
    assert median == (40_000 + 25_000) / 2


# ---------- Filtered avg-by-job-title ----------

def test_avg_salary_by_job_title_filtered_to_country(
    analytics_repo, sample_dataset
):
    # India only: SWE 40_000 + Recruiter 25_000
    rows = analytics_repo.avg_salary_by_job_title(country="India")
    by_title = {title: (avg, count) for title, avg, count in rows}
    assert set(by_title.keys()) == {"Software Engineer", "Recruiter"}
    assert by_title["Software Engineer"][0] == 40_000.0
    assert by_title["Recruiter"][0] == 25_000.0


def test_avg_salary_by_job_title_without_filter_is_unchanged(
    analytics_repo, sample_dataset
):
    # Sanity: omitting the filter matches the un-filtered count of distinct
    # job titles in the fixture.
    rows = analytics_repo.avg_salary_by_job_title()
    assert len(rows) >= 4


def test_avg_salary_by_job_title_filtered_by_department(analytics_repo, sample_dataset):
    # Engineering-only roles: Senior Engineer (US 150k), Software Engineer (US 120k,
    # Germany 90k, India 40k -> avg 83333).
    rows = analytics_repo.avg_salary_by_job_title(department="Engineering")
    by_title = {title: (avg, count) for title, avg, count in rows}
    assert set(by_title.keys()) == {"Senior Engineer", "Software Engineer"}
    assert by_title["Senior Engineer"][0] == 150_000.0


def test_avg_salary_by_job_title_filter_country_and_department(
    analytics_repo, sample_dataset
):
    rows = analytics_repo.avg_salary_by_job_title(
        country="Germany", department="Engineering"
    )
    by_title = {title: (avg, count) for title, avg, count in rows}
    assert set(by_title.keys()) == {"Software Engineer"}
    assert by_title["Software Engineer"][0] == 90_000.0


# ---------- Salary distribution ----------

def test_salary_distribution_buckets_to_25k(analytics_repo, sample_dataset):
    """Bucket assignment uses `salary - (salary % bucket_size)`.

    Fixture salaries -> buckets (bucket_low = salary - salary%25000):
      25_000  -> 25_000
      40_000  -> 25_000
      90_000  -> 75_000
      100_000 -> 100_000
      110_000 -> 100_000
      120_000 -> 100_000
      150_000 -> 150_000
    """
    rows = dict(analytics_repo.salary_distribution(bucket_size=25_000))
    assert rows == {25_000: 2, 75_000: 1, 100_000: 3, 150_000: 1}


def test_salary_distribution_filtered_by_country(analytics_repo, sample_dataset):
    # India only: 40_000 and 25_000
    rows = dict(analytics_repo.salary_distribution(bucket_size=25_000, country="India"))
    assert rows == {25_000: 2}


def test_salary_distribution_empty_when_filter_misses(analytics_repo, sample_dataset):
    rows = analytics_repo.salary_distribution(country="Atlantis")
    assert rows == []


# ---------- Salary percentiles ----------

def test_salary_percentiles_empty_db(analytics_repo):
    count, p = analytics_repo.salary_percentiles()
    assert count == 0
    assert p == {"p10": None, "p25": None, "p50": None, "p75": None, "p90": None, "p99": None}


def test_salary_percentiles_full_set(analytics_repo, sample_dataset):
    # Sorted fixture salaries: [25k, 40k, 90k, 100k, 110k, 120k, 150k] (n=7)
    count, p = analytics_repo.salary_percentiles()
    assert count == 7
    # Nearest-rank: idx = int(p/100 * n)
    # 50% -> idx 3 -> 100_000
    assert p["p50"] == 100_000
    assert p["p10"] == 25_000  # idx 0
    assert p["p99"] == 150_000  # clamped to last


def test_salary_percentiles_filtered_by_department(analytics_repo, sample_dataset):
    # Sales: 110k + 100k
    count, p = analytics_repo.salary_percentiles(department="Sales")
    assert count == 2
    assert p["p50"] in (100_000, 110_000)


# ---------- Tenure bands ----------

def test_tenure_bands_canonical_order_and_counts(analytics_repo, sample_dataset):
    from datetime import date as _date

    # Fixture sets hire_date=2022-01-01 for every employee. Pin `as_of` to
    # 2025-06-15 -> tenure ~ 3.45 years -> all rows land in "3–5 years".
    bands = analytics_repo.tenure_bands(as_of=_date(2025, 6, 15))
    assert [b[0] for b in bands] == [
        "< 1 year",
        "1–3 years",
        "3–5 years",
        "5–10 years",
        "10+ years",
    ]
    by_band = {name: count for name, count, _ in bands}
    assert by_band["3–5 years"] == 7
    assert by_band["< 1 year"] == 0


def test_tenure_bands_empty_band_returns_none_avg(analytics_repo, sample_dataset):
    from datetime import date as _date

    bands = analytics_repo.tenure_bands(as_of=_date(2025, 6, 15))
    for name, count, avg in bands:
        if count == 0:
            assert avg is None
        else:
            assert avg is not None and avg > 0


def test_tenure_bands_filtered_by_department(analytics_repo, sample_dataset):
    from datetime import date as _date

    bands = analytics_repo.tenure_bands(
        department="HR", as_of=_date(2025, 6, 15)
    )
    total = sum(b[1] for b in bands)
    assert total == 1  # Only the Recruiter row is in HR


# ---------- Hiring trends ----------

def test_hiring_trends_year_groups_correctly(analytics_repo, sample_dataset):
    # Fixture: every employee was hired on 2022-01-01.
    rows = dict(analytics_repo.hiring_trends(granularity="year"))
    assert rows == {"2022": 7}


def test_hiring_trends_month_granularity(analytics_repo, sample_dataset):
    rows = dict(analytics_repo.hiring_trends(granularity="month"))
    assert rows == {"2022-01": 7}


def test_hiring_trends_rejects_unknown_granularity(analytics_repo):
    import pytest as _pytest

    with _pytest.raises(ValueError):
        analytics_repo.hiring_trends(granularity="week")


def test_hiring_trends_filtered_country(analytics_repo, sample_dataset):
    rows = dict(analytics_repo.hiring_trends(granularity="year", country="India"))
    assert sum(rows.values()) == 2
