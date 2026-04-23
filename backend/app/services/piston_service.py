from dataclasses import dataclass

import httpx

from app.config import settings

_LANGUAGE = "python"
_VERSION = "3.10.0"
_TIMEOUT = 10.0


@dataclass
class PistonResult:
    stdout: str
    stderr: str
    exit_code: int
    compile_output: str


async def run_code(code: str, stdin: str = "", language: str = _LANGUAGE) -> PistonResult:
    payload = {
        "language": language,
        "version": _VERSION,
        "files": [{"name": "main.py", "content": code}],
        "stdin": stdin,
        "run_timeout": int(_TIMEOUT * 1000),
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT + 2) as client:
        response = await client.post(
            f"{settings.PISTON_API_URL}/api/v2/execute",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    run = data.get("run", {})
    compile_info = data.get("compile", {})

    return PistonResult(
        stdout=run.get("stdout", ""),
        stderr=run.get("stderr", ""),
        exit_code=run.get("code", -1),
        compile_output=compile_info.get("stdout", "") + compile_info.get("stderr", ""),
    )
