"""FastAPI 入口：健康检查 + CORS + 路由 + 异常处理。"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.errors import BizError
from app.routers import majors, score_rank, schools

app = FastAPI(title="gkvr 后端", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BizError)
async def biz_error_handler(request: Request, exc: BizError):
    return JSONResponse(status_code=400, content={"code": exc.code, "message": exc.message, "data": None})


app.include_router(schools.router)
app.include_router(majors.router)
app.include_router(score_rank.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
