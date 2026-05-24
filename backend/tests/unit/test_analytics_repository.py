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
