import asyncio
import os
import signal
import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/system", tags=["system"])

def _trigger_restart():
    logger.info("[BrainByte System] Server restart requested via Web UI. Terminating process...")
    try:
        os.kill(os.getpid(), signal.SIGTERM)
    except Exception:
        os._exit(0)

@router.post("/restart")
async def restart_server():
    """
    Triggers a process restart. When running inside Docker / NAS Container Manager,
    the 'restart: unless-stopped' container policy will immediately reboot the container with updated files.
    """
    try:
        # Schedule process exit 500ms after sending HTTP response
        async def delayed_exit():
            await asyncio.sleep(0.5)
            _trigger_restart()

        asyncio.create_task(delayed_exit())

        return {
            "status": "restarting",
            "message": "Server restart initiated. Container will reboot in 1 second."
        }
    except Exception as e:
        logger.error(f"Failed to initiate server restart: {e}")
        raise HTTPException(status_code=500, detail=str(e))
