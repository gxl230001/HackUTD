from tests.conftest import MEMBER_A1, MEMBER_B1, USER_B, USER_NO_FAMILY, auth


def test_get_family(client):
    response = client.get("/api/family", headers=auth())
    assert response.status_code == 200
    assert response.json()["name"] == "Rivera Family"
    assert response.json()["member_count"] == 1


def test_list_members_only_returns_own_family(client):
    response = client.get("/api/members", headers=auth())
    assert response.status_code == 200
    assert [m["id"] for m in response.json()] == [str(MEMBER_A1)]


def test_get_own_member(client):
    response = client.get(f"/api/members/{MEMBER_A1}", headers=auth())
    assert response.status_code == 200
    assert response.json()["display_name"] == "Mom"


def test_other_family_member_is_404(client):
    response = client.get(f"/api/members/{MEMBER_B1}", headers=auth())
    assert response.status_code == 404


def test_other_user_cannot_see_family_a_member(client):
    response = client.get(f"/api/members/{MEMBER_A1}", headers=auth(USER_B))
    assert response.status_code == 404


def test_user_without_family_is_403(client):
    response = client.get("/api/family", headers=auth(USER_NO_FAMILY))
    assert response.status_code == 403


def test_invalid_member_id_is_422(client):
    response = client.get("/api/members/not-a-uuid", headers=auth())
    assert response.status_code == 422


def test_health_without_database_config_is_degraded(monkeypatch):
    from fastapi.testclient import TestClient

    from app.api.routes import health
    from app.main import app

    monkeypatch.setattr(health, "get_supabase", lambda: None)
    response = TestClient(app).get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "degraded", "database": "not_configured"}
