def test_health_endpoint_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "app" in body
    assert "version" in body


def test_request_id_header_is_echoed(client):
    response = client.get("/health", headers={"X-Request-ID": "test-rid-123"})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == "test-rid-123"


def test_request_id_is_generated_when_missing(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID")
