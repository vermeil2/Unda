from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from .routers import jobs, provision
from .routers import infra


def create_app() -> FastAPI:
    app = FastAPI(
        title="Unda IDP Backend",
        version="0.1.0",
    )

    # TODO: 환경에 맞게 origin 제한
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(provision.router, prefix="/api/v1")
    app.include_router(jobs.router, prefix="/api/v1")
    app.include_router(infra.router, prefix="/api/v1")

    return app


app = create_app()

