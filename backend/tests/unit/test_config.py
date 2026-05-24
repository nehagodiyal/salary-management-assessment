from app.core.config import Settings


def test_settings_defaults_in_test_env():
    s = Settings()
    assert s.APP_ENV == "test"
    assert s.JWT_ALGORITHM == "HS256"
    assert s.ACCESS_TOKEN_EXPIRE_MINUTES > 0
    assert s.is_sqlite is True


def test_cors_origins_list_parses_csv(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "http://a.com, http://b.com")
    s = Settings()
    assert s.cors_origins_list == ["http://a.com", "http://b.com"]
