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
