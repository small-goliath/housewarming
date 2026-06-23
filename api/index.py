"""Vercel Python 서버리스 함수 진입점 (단일 프로젝트용).

모든 /api/* 요청이 vercel.json의 rewrite를 통해 이 함수로 전달된다.
FastAPI 앱은 backend/ 디렉토리에 있으며, 이 파일에서 import해 실행한다.
"""

import os
import sys

# 프로젝트 루트의 backend/ 를 import 경로에 추가
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_root, "backend"))

from main import app  # noqa: E402

__all__ = ["app"]
