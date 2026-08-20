import asyncio
from app.api.memory_routes import get_memory
import traceback

async def main():
    try:
        m = get_memory()
        res = await m.get_all(user_id='test')
        print(res)
    except Exception as e:
        traceback.print_exc()

asyncio.run(main())
