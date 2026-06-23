"""Vercel Python(서버리스) 진입점.

Vercel 백엔드 프로젝트의 Root Directory 를 `backend/` 로 설정하면,
배포 루트(=backend 내용)가 sys.path 에 오르고 `main:app` 을 그대로 사용할 수 있다.
모든 경로는 vercel.json 의 rewrite 로 이 함수에 전달된다.
"""

import os
import sys

# 배포 루트(api/ 의 부모)를 import 경로에 추가 → main, config, routers ... 해석
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402

# Vercel @vercel/python 은 모듈의 ASGI `app` 변수를 감지해 실행한다.
__all__ = ["app"]
