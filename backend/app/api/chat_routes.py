from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.domains.memory.service import Memory
from app.domains.memory.schemas import MemoryConfig
from app.core.config import MemoryConfig as CoreConfig

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# Dependency to get memory instance (in production, use a proper dependency injection)
def get_memory():
    # In a real app, this should be a singleton tied to app state
    config = CoreConfig()
    return Memory(config)

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, memory: Memory = Depends(get_memory)):
    """
    Core chat endpoint. Extracts facts from the user message, updates memory,
    and returns a contextual response using the memory engine.
    """
    # The Memory.add method in CortexDB actually returns facts, but we also want a chat response.
    # We will orchestrate the LLM here or rely on the memory service.
    
    # For now, we wrap the memory addition.
    facts = await memory.add(request.message)
    
    # Generate a chat response (Assuming MistralLLM is accessible or we add a chat method)
    # Placeholder for the actual context-aware generation logic:
    context = await memory.search(request.message)
    
    # This is a simplistic placeholder until the full prompt logic is wired
    return ChatResponse(response=f"I stored your facts: {facts}. I remember related things like: {context}")
