import threading
from app.core.config import MemoryConfig
from app.domains.memory.service import Memory

_memory_instance = None
_lock = threading.Lock()

def get_memory():
    global _memory_instance
    if _memory_instance is None:
        with _lock:
            if _memory_instance is None:
                config = MemoryConfig()
                _memory_instance = Memory(config)
    return _memory_instance
