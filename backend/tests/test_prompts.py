import pytest

from src.services.prompts import PROMPTS_DIR, load_system_prompt


def test_v1_existe_y_se_carga():
    assert (PROMPTS_DIR / "v1.md").exists()
    prompt = load_system_prompt("v1")
    assert "retrieve_documents" in prompt
    assert "load_skill" in prompt
    # El placeholder siempre se reemplaza (con el contexto de Neon o vacío).
    assert "{neon_context}" not in prompt


def test_v2_incluye_catalogo_de_servicios():
    assert (PROMPTS_DIR / "v2.md").exists()
    prompt = load_system_prompt("v2")
    # Los servicios van en el prompt para que el agente no los infiera de list_skills.
    for servicio in ["Pedidos", "Devoluciones", "Cambios de talla", "Métodos de pago", "UFit Club"]:
        assert servicio in prompt
    assert "load_skill" in prompt
    assert "{neon_context}" not in prompt


def test_version_inexistente_falla():
    with pytest.raises(FileNotFoundError):
        load_system_prompt("v999")
