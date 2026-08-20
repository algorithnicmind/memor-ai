import asyncio
from app.core.config import MemoryConfig
from app.domains.memory.service import Memory

async def test():
    try:
        config = MemoryConfig()
        m = Memory(config)
        print("Memory init OK")
        res = await m.storage.get_all()
        print("Storage get_all OK:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
