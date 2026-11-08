from types import SimpleNamespace

from app.config import Settings
from app.schemas.recommendations import Evidence, Recommendation
from app.services import explanations

REC = Recommendation(category="encourage_reporting", title="t", reasons=[], evidence=[
    Evidence(key="k", label="l", value="1")], summary="", why_it_matters="", next_steps=[], features=[],
    mentions_premium=False)


def test_reads_gemini_api_key(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "abc123")
    assert Settings(_env_file=None).gemini_api_key == "abc123"


def test_accepts_google_api_key_name(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GOOGLE_API_KEY", "from-google-name")
    assert Settings(_env_file=None).gemini_api_key == "from-google-name"


def test_strips_quotes_and_spaces(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", '  "quoted-key" ')
    assert Settings(_env_file=None).gemini_api_key == "quoted-key"


def test_vertex_flag_defaults_off_and_reads_env(monkeypatch):
    assert Settings(_env_file=None).gemini_use_vertexai is False
    monkeypatch.setenv("GEMINI_USE_VERTEXAI", "true")
    assert Settings(_env_file=None).gemini_use_vertexai is True


def test_client_gets_key_and_vertex_flag(monkeypatch):
    from google import genai

    seen = {}

    class FakeClient:
        def __init__(self, **kwargs):
            seen.update(kwargs)
            self.models = SimpleNamespace(generate_content=lambda **_: SimpleNamespace(
                parsed=None, text='{"summary": "' + "x" * 25 + '", "why_it_matters": "' + "y" * 25
                + '", "next_steps": ["do a thing"]}'))

    monkeypatch.setattr(genai, "Client", FakeClient)
    settings = Settings(_env_file=None, gemini_api_key="project-key", gemini_use_vertexai=True)
    explanations._call_gemini(settings, explanations.build_payload(REC, "Mom", 30))
    assert seen["api_key"] == "project-key"
    assert seen["vertexai"] is True


def test_timeout_raised_to_google_minimum(monkeypatch):
    monkeypatch.setenv("GEMINI_TIMEOUT_SECONDS", "8")
    assert Settings(_env_file=None).gemini_timeout_seconds == 10.0
    monkeypatch.setenv("GEMINI_TIMEOUT_SECONDS", "15")
    assert Settings(_env_file=None).gemini_timeout_seconds == 15.0


def _capture_config(monkeypatch, **settings_kwargs):
    from google import genai

    seen = {}

    class FakeClient:
        def __init__(self, **_):
            def generate_content(**kwargs):
                seen.update(kwargs)
                return SimpleNamespace(parsed=None, text='{"summary": "' + "x" * 25 + '", "why_it_matters": "'
                                       + "y" * 25 + '", "next_steps": ["do a thing"]}')
            self.models = SimpleNamespace(generate_content=generate_content)

    monkeypatch.setattr(genai, "Client", FakeClient)
    settings = Settings(_env_file=None, gemini_api_key="k", **settings_kwargs)
    explanations._call_gemini(settings, explanations.build_payload(REC, "Mom", 30))
    return seen["config"]


def test_thinking_level_sent_by_default(monkeypatch):
    config = _capture_config(monkeypatch)
    assert config.thinking_config.thinking_level.value.lower() == "minimal"


def test_empty_thinking_level_uses_model_default(monkeypatch):
    assert _capture_config(monkeypatch, gemini_thinking_level="").thinking_config is None
