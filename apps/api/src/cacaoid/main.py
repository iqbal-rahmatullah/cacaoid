from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cacaoid import config
from cacaoid.api import ai, batches, dashboard, impact, passport, registry, seals, search, tasks
from cacaoid.db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="CacaoID API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5174"], allow_methods=["*"], allow_headers=["*"])
app.include_router(registry.router)
app.include_router(batches.router)
app.include_router(ai.router)
app.include_router(dashboard.router)
app.include_router(impact.router)
app.include_router(passport.router)
app.include_router(search.router)
app.include_router(tasks.router)
app.include_router(seals.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "simulated_data": config.SIMULATED}
