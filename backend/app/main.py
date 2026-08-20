from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat_routes import router as chat_router
from app.api.memory_routes import router as memory_router

app = FastAPI(
    title="Memorai API",
    description="Backend API for the Memorai AI Companion, built with CortexDB memory core.",
    version="1.0.0"
)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(memory_router, prefix="/api", tags=["memories"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Memorai API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
