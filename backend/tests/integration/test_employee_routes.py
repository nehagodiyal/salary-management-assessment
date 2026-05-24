from datetime import date

BASE = "/api/v1/employees"


def _create_payload(**overrides):
    base = {
        "full_name": "Created Person",
        "email": "created@example.com",
        "phone": "+1-555-1234",
        "country": "United States",
        "department": "Engineering",
        "job_title": "Software Engineer",
        "salary": 95_000,
        "hire_date": str(date(2023, 5, 15)),
        "status": "active",
    }
    base.update(overrides)
    return base


# ---------- Auth gating ----------

def test_list_requires_authentication(client):
    r = client.get(BASE)
    assert r.status_code == 401


def test_create_requires_admin(client, regular_user, auth_header_for):
    r = client.post(BASE, headers=auth_header_for(regular_user), json=_create_payload())
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "ROLE_FORBIDDEN"


def test_update_requires_admin(client, regular_user, auth_header_for, make_employee):
    emp = make_employee()
    r = client.put(
        f"{BASE}/{emp.id}",
        headers=auth_header_for(regular_user),
        json={"salary": 100_000},
    )
    assert r.status_code == 403


def test_delete_requires_admin(client, regular_user, auth_header_for, make_employee):
    emp = make_employee()
    r = client.delete(f"{BASE}/{emp.id}", headers=auth_header_for(regular_user))
    assert r.status_code == 403


# ---------- Reads ----------

def test_list_returns_paginated_envelope(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}?page=1&page_size=3",
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    body = r.json()
    assert set(body) >= {"items", "total", "page", "page_size", "pages"}
    assert body["total"] == 7
    assert body["pages"] == 3
    assert len(body["items"]) == 3


def test_list_filter_by_country(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}?country=Germany",
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 200
    assert r.json()["total"] == 2


def test_list_search_matches_email(client, regular_user, auth_header_for, make_employee):
    make_employee(email="findme@example.com", full_name="Find Me")
    make_employee(email="ignored@example.com", full_name="Other")
    r = client.get(
        f"{BASE}?search=findme",
        headers=auth_header_for(regular_user),
    )
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["email"] == "findme@example.com"


def test_list_sort_by_salary_desc(client, regular_user, auth_header_for, sample_dataset):
    r = client.get(
        f"{BASE}?sort_by=salary&sort_dir=desc",
        headers=auth_header_for(regular_user),
    )
    salaries = [e["salary"] for e in r.json()["items"]]
    assert salaries == sorted(salaries, reverse=True)


def test_list_invalid_salary_range_returns_422(client, regular_user, auth_header_for):
    r = client.get(
        f"{BASE}?salary_min=200000&salary_max=100000",
        headers=auth_header_for(regular_user),
    )
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "SALARY_RANGE_INVALID"


def test_get_returns_employee(client, regular_user, auth_header_for, make_employee):
    emp = make_employee(email="single@example.com")
    r = client.get(f"{BASE}/{emp.id}", headers=auth_header_for(regular_user))
    assert r.status_code == 200
    assert r.json()["email"] == "single@example.com"


def test_get_missing_returns_404(client, regular_user, auth_header_for):
    r = client.get(f"{BASE}/missing-id", headers=auth_header_for(regular_user))
    assert r.status_code == 404
    assert r.json()["error"]["code"] == "EMPLOYEE_NOT_FOUND"


# ---------- Writes ----------

def test_admin_can_create_employee(client, admin_user, auth_header_for):
    r = client.post(BASE, headers=auth_header_for(admin_user), json=_create_payload())
    assert r.status_code == 201
    body = r.json()
    assert body["id"]
    assert body["email"] == "created@example.com"
    assert body["status"] == "active"


def test_create_duplicate_email_returns_409(client, admin_user, auth_header_for):
    payload = _create_payload(email="twice@example.com")
    client.post(BASE, headers=auth_header_for(admin_user), json=payload)
    r = client.post(BASE, headers=auth_header_for(admin_user), json=payload)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "EMPLOYEE_EMAIL_TAKEN"


def test_create_validation_error_on_negative_salary(client, admin_user, auth_header_for):
    r = client.post(
        BASE,
        headers=auth_header_for(admin_user),
        json=_create_payload(salary=-1),
    )
    assert r.status_code == 422


def test_admin_can_update_employee(client, admin_user, auth_header_for, make_employee):
    emp = make_employee()
    r = client.put(
        f"{BASE}/{emp.id}",
        headers=auth_header_for(admin_user),
        json={"salary": 130_000, "status": "on_leave"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["salary"] == 130_000
    assert body["status"] == "on_leave"


def test_admin_can_delete_employee(client, admin_user, auth_header_for, make_employee):
    emp = make_employee()
    r = client.delete(f"{BASE}/{emp.id}", headers=auth_header_for(admin_user))
    assert r.status_code == 204
    follow = client.get(f"{BASE}/{emp.id}", headers=auth_header_for(admin_user))
    assert follow.status_code == 404
