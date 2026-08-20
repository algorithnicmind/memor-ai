from fastapi import APIRouter, Depends, HTTPException
from typing import List, Any
from app.domains.memory.service import Memory
from app.core.config import MemoryConfig

router = APIRouter()

def get_memory():
    config = MemoryConfig()
    return Memory(config)

@router.get("/memories")
async def get_all_memories(memory: Memory = Depends(get_memory)):
    """
    Retrieve all memories from the storage.
    """
    try:
        # Assuming memory.storage has a get_all method or similar implementation
        # For CortexDB, we can search for everything or fetch from SQLite/Kuzu directly
        memories = await memory.storage.get_all()
        return {"memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, memory: Memory = Depends(get_memory)):
    """
    Delete a specific memory by ID.
    """
    try:
        await memory.delete(memory_id)
        return {"status": "success", "message": f"Memory {memory_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
