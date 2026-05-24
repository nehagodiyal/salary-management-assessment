"""End-to-end auth route tests.

These hit the live FastAPI app via TestClient with `get_db` overridden to
the per-test session, so every assertion exercises the full request →
middleware → router → service → repository → DB chain.
"""

LOGIN_URL = "/api/v1/auth/login"
REFRESH_URL = "/api/v1/auth/refresh"
REGISTER_URL = "/api/v1/auth/register"
ME_URL = "/api/v1/auth/me"


# ---------- /login ----------

def test_login_with_valid_credentials_returns_token_pair(client, regular_user):
    r = client.post(LOGIN_URL, json={"email": regular_user.email, "password": "Sup3rSecret!"})
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["token_type"] == "bearer"


def test_login_with_wrong_password_returns_401(client, regular_user):
    r = client.post(LOGIN_URL, json={"email": regular_user.email, "password": "WrongPass!"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "BAD_CREDENTIALS"


def test_login_with_unknown_email_returns_401(client):
    r = client.post(LOGIN_URL, json={"email": "ghost@example.com", "password": "Sup3rSecret!"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "BAD_CREDENTIALS"


def test_login_validation_error_on_bad_email(client):
    r = client.post(LOGIN_URL, json={"email": "not-an-email", "password": "Sup3rSecret!"})
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "VALIDATION_ERROR"


def test_login_validation_error_on_short_password(client):
    r = client.post(LOGIN_URL, json={"email": "a@b.com", "password": "short"})
    assert r.status_code == 422


# ---------- /me (protected) ----------

def test_me_requires_token(client):
    r = client.get(ME_URL)
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "MISSING_TOKEN"


def test_me_rejects_garbage_token(client):
    r = client.get(ME_URL, headers={"Authorization": "Bearer not-a-token"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "TOKEN_INVALID"


def test_me_rejects_refresh_token_as_access(client, regular_user, auth_service):
    tokens = auth_service.issue_tokens(regular_user)
    r = client.get(ME_URL, headers={"Authorization": f"Bearer {tokens.refresh_token}"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "TOKEN_WRONG_TYPE"


def test_me_returns_current_user(client, regular_user, auth_header_for):
    r = client.get(ME_URL, headers=auth_header_for(regular_user))
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == regular_user.email
    assert body["role"] == "user"
    assert body["id"] == regular_user.id


# ---------- /refresh ----------

def test_refresh_returns_new_tokens(client, regular_user, auth_service):
    tokens = auth_service.issue_tokens(regular_user)
    r = client.post(REFRESH_URL, json={"refresh_token": tokens.refresh_token})
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"] and body["refresh_token"]


def test_refresh_rejects_access_token(client, regular_user, auth_service):
    tokens = auth_service.issue_tokens(regular_user)
    r = client.post(REFRESH_URL, json={"refresh_token": tokens.access_token})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "TOKEN_WRONG_TYPE"


# ---------- /register (admin-only) ----------

def test_register_requires_authentication(client):
    r = client.post(REGISTER_URL, json={"email": "x@y.com", "password": "Sup3rSecret!"})
    assert r.status_code == 401


def test_register_rejects_regular_user(client, regular_user, auth_header_for):
    r = client.post(
        REGISTER_URL,
        headers=auth_header_for(regular_user),
        json={"email": "new@y.com", "password": "Sup3rSecret!"},
    )
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "ROLE_FORBIDDEN"


def test_register_allows_admin(client, admin_user, auth_header_for):
    r = client.post(
        REGISTER_URL,
        headers=auth_header_for(admin_user),
        json={"email": "newby@example.com", "password": "Sup3rSecret!"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "newby@example.com"
    assert body["role"] == "user"


def test_register_duplicate_email_returns_409(client, admin_user, auth_header_for):
    payload = {"email": "twice@example.com", "password": "Sup3rSecret!"}
    client.post(REGISTER_URL, headers=auth_header_for(admin_user), json=payload)
    r = client.post(REGISTER_URL, headers=auth_header_for(admin_user), json=payload)
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "EMAIL_TAKEN"


# ---------- end-to-end flow ----------

def test_full_login_then_protected_route_flow(client, regular_user):
    login = client.post(
        LOGIN_URL,
        json={"email": regular_user.email, "password": "Sup3rSecret!"},
    )
    access = login.json()["access_token"]

    me = client.get(ME_URL, headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    assert me.json()["id"] == regular_user.id
