"""End-to-end checks for the analytics routes.

These rely on the same `sample_dataset` fixture used by the repository tests,
so any number we assert against here can be cross-referenced there.
"""

BASE = "/api/v1/analytics"


# ---------- Auth gating ----------

def test_dashboard_requires_authentication(client):
    r = client.get(f"{BASE}/dashboard")
    assert r.status_code == 401


def test_salary_stats_requires_authentication(client):
    r = client.get(f"{BASE}/salary-stats")
    assert r.status_code == 401


# ---------- Salary stats ----------

def test_salary_stats_empty(client, regular_user, auth_header_for):
    r = client.get(f"{BASE}/salary-stats", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 0
    assert body["average"] is None
    assert body["median"] is None


def test_salary_stats_with_data(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/salary-stats", headers=auth_header_for(regular_user))
    body = r.json()
    assert body["count"] == 7
    assert body["minimum"] == 25_000
    assert body["maximum"] == 150_000


# ---------- Grouped aggregations ----------

def test_avg_salary_by_country(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}/avg-salary/country", headers=auth_header_for(regular_user)
    )
    body = r.json()
    groups = {row["group"]: row for row in body}
    assert set(groups) == {"United States", "Germany", "India"}
    assert groups["United States"]["employee_count"] == 3


def test_avg_salary_by_job_title(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}/avg-salary/job-title", headers=auth_header_for(regular_user)
    )
    body = r.json()
    averages = [row["average_salary"] for row in body]
    assert averages == sorted(averages, reverse=True)


def test_avg_salary_by_department(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}/avg-salary/department", headers=auth_header_for(regular_user)
    )
    body = r.json()
    deps = {row["group"] for row in body}
    assert {"Engineering", "Sales", "HR"} <= deps


def test_count_by_country(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}/count/country", headers=auth_header_for(regular_user)
    )
    body = {row["group"]: row["employee_count"] for row in r.json()}
    assert body == {"United States": 3, "Germany": 2, "India": 2}


def test_count_by_department(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}/count/department", headers=auth_header_for(regular_user)
    )
    body = {row["group"]: row["employee_count"] for row in r.json()}
    assert body == {"Engineering": 4, "Sales": 2, "HR": 1}


# ---------- Top groups ----------

def test_highest_paying_country_is_us(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/top/country", headers=auth_header_for(regular_user))
    assert r.json()["group"] == "United States"


def test_highest_paying_department_is_sales(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/top/department", headers=auth_header_for(regular_user))
    assert r.json()["group"] == "Sales"


def test_top_endpoints_return_null_when_empty(client, regular_user, auth_header_for):
    r = client.get(f"{BASE}/top/country", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    assert r.json() is None


# ---------- Per-country salary stats ----------

def test_salary_stats_for_country_requires_auth(client):
    r = client.get(f"{BASE}/country/India/salary-stats")
    assert r.status_code == 401


def test_salary_stats_for_country_known(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/country/United%20States/salary-stats",
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 3
    assert body["minimum"] == 110_000
    assert body["maximum"] == 150_000
    assert body["median"] == 120_000


def test_salary_stats_for_country_unknown_returns_zero(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/country/Atlantis/salary-stats",
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 0
    assert body["average"] is None
    assert body["median"] is None


# ---------- avg-salary/job-title with country filter ----------

def test_avg_salary_by_job_title_filtered_by_country(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/avg-salary/job-title",
        params={"country": "India"},
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    by_title = {row["group"]: row["average_salary"] for row in r.json()}
    assert set(by_title.keys()) == {"Software Engineer", "Recruiter"}
    assert by_title["Software Engineer"] == 40_000
    assert by_title["Recruiter"] == 25_000


def test_avg_salary_by_job_title_filter_unknown_country_is_empty(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/avg-salary/job-title",
        params={"country": "Atlantis"},
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    assert r.json() == []


# ---------- Salary distribution ----------

def test_salary_distribution_requires_auth(client):
    r = client.get(f"{BASE}/salary-distribution")
    assert r.status_code == 401


def test_salary_distribution_default_bucket_size(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/salary-distribution", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    rows = r.json()
    # Each row has bucket_low/bucket_high/count and is sorted asc.
    lows = [row["bucket_low"] for row in rows]
    assert lows == sorted(lows)
    assert all(row["bucket_high"] == row["bucket_low"] + 25_000 for row in rows)
    assert sum(row["count"] for row in rows) == 7


def test_salary_distribution_country_filter(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/salary-distribution",
        params={"country": "India"},
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    rows = r.json()
    assert sum(row["count"] for row in rows) == 2


def test_salary_distribution_bucket_size_validation(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/salary-distribution",
        params={"bucket_size": 0},
        headers=auth_header_for(regular_user),
    )
    # bucket_size must be >= 1_000 per the Query() bound.
    assert r.status_code == 422


# ---------- Salary percentiles ----------

def test_percentiles_requires_auth(client):
    r = client.get(f"{BASE}/percentiles")
    assert r.status_code == 401


def test_percentiles_empty_db_returns_nulls(client, regular_user, auth_header_for):
    r = client.get(f"{BASE}/percentiles", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 0
    assert body["p50"] is None


def test_percentiles_full_population(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/percentiles", headers=auth_header_for(regular_user))
    body = r.json()
    assert body["count"] == 7
    assert body["p50"] == 100_000
    assert body["p10"] == 25_000


def test_percentiles_with_department_filter(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/percentiles",
        params={"department": "Sales"},
        headers=auth_header_for(regular_user),
    )
    body = r.json()
    assert body["count"] == 2


# ---------- Tenure bands ----------

def test_tenure_bands_requires_auth(client):
    r = client.get(f"{BASE}/tenure-bands")
    assert r.status_code == 401


def test_tenure_bands_returns_full_canonical_order(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/tenure-bands", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    bands = r.json()
    # Canonical band order always present, even when bands are empty.
    assert [b["band"] for b in bands] == [
        "< 1 year",
        "1–3 years",
        "3–5 years",
        "5–10 years",
        "10+ years",
    ]
    # All seven fixture employees were hired on 2022-01-01, so headcount sums to 7.
    assert sum(b["employee_count"] for b in bands) == 7


# ---------- Hiring trends ----------

def test_hiring_trends_requires_auth(client):
    r = client.get(f"{BASE}/hiring-trends")
    assert r.status_code == 401


def test_hiring_trends_default_year_granularity(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/hiring-trends", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    rows = r.json()
    assert sum(row["hire_count"] for row in rows) == 7
    # Sorted ascending
    periods = [row["period"] for row in rows]
    assert periods == sorted(periods)


def test_hiring_trends_month_granularity(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/hiring-trends",
        params={"granularity": "month"},
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    for row in r.json():
        assert len(row["period"]) == 7  # YYYY-MM


def test_hiring_trends_rejects_invalid_granularity(
    client, regular_user, auth_header_for
):
    r = client.get(
        f"{BASE}/hiring-trends",
        params={"granularity": "week"},
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 422


# ---------- avg-salary/job-title with department filter ----------

def test_avg_salary_by_job_title_filtered_by_department(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/avg-salary/job-title",
        params={"department": "Sales"},
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    by_title = {row["group"]: row["average_salary"] for row in r.json()}
    assert set(by_title.keys()) == {"Account Executive", "Sales Manager"}


def test_avg_salary_by_job_title_filter_country_and_department(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(
        f"{BASE}/avg-salary/job-title",
        params={"country": "Germany", "department": "Engineering"},
        headers=auth_header_for(regular_user),
    )
    by_title = {row["group"]: row["average_salary"] for row in r.json()}
    assert by_title == {"Software Engineer": 90_000}


# ---------- Dashboard summary ----------

def test_dashboard_summary_payload(
    client, regular_user, auth_header_for, sample_dataset
):
    r = client.get(f"{BASE}/dashboard", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    body = r.json()
    assert body["salary_stats"]["count"] == 7
    assert body["highest_paying_country"]["group"] == "United States"
    assert body["highest_paying_department"]["group"] == "Sales"
    assert len(body["employees_by_country"]) == 3
    # status breakdown ships in the same single round-trip
    statuses = {row["group"]: row["employee_count"] for row in body["employees_by_status"]}
    assert statuses == {"active": 7}
