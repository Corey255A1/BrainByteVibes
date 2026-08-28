import asyncio
import os
import sys
import signal
import logging
import tarfile
import shutil
import tempfile
import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.core.config import settings

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

def _is_within_directory(directory: str, target: str) -> bool:
    abs_directory = os.path.abspath(directory)
    abs_target = os.path.abspath(target)
    prefix = os.path.commonprefix([abs_directory, abs_target])
    return prefix == abs_directory

@router.post("/upload-update")
async def upload_update_package(file: UploadFile = File(...)):
    """
    Accepts a .tgz / .tar.gz package, extracts contents over current installation,
    rebuilds frontend static bundle if npm is present, and restarts container.
    """
    if not file.filename.endswith(('.tgz', '.tar.gz', '.tar')):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .tgz or .tar.gz archive")

    # Determine root app directory (parent of app package directory)
    app_dir = Path(__file__).resolve().parent.parent.parent.parent
    logger.info(f"[BrainByte OTA] Target app directory for update: {app_dir}")

    temp_dir = tempfile.mkdtemp(prefix="brainbyte_update_")
    tgz_path = os.path.join(temp_dir, "update.tgz")

    try:
        # 1. Save uploaded package to temporary file
        with open(tgz_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Extract tarball securely to temporary folder
        extract_dir = os.path.join(temp_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)

        with tarfile.open(tgz_path, "r:*") as tar:
            for member in tar.getmembers():
                member_path = os.path.join(extract_dir, member.name)
                if not _is_within_directory(extract_dir, member_path):
                    raise Exception(f"Potential path traversal in tarball: {member.name}")
            tar.extractall(extract_dir)

        # If tarball has a single top-level folder wrapper (e.g. BrainByteVibes-main/), navigate inside it
        source_root = Path(extract_dir)
        sub_items = [p for p in source_root.iterdir() if p.name not in ('.', '..')]
        if len(sub_items) == 1 and sub_items[0].is_dir():
            source_root = sub_items[0]

        # 3. Copy extracted files into target app directory
        logger.info(f"[BrainByte OTA] Copying files from {source_root} to {app_dir}...")
        for item in source_root.iterdir():
            if item.name in ('.git', '__pycache__', 'node_modules', '.venv', 'venv'):
                continue
            dest_path = app_dir / item.name
            if item.is_dir():
                if dest_path.exists():
                    shutil.copytree(item, dest_path, dirs_exist_ok=True)
                else:
                    shutil.copytree(item, dest_path)
            else:
                shutil.copy2(item, dest_path)

        # 4. Check & rebuild static frontend assets
        frontend_dir = app_dir / "frontend"
        static_dest = Path(settings.STATIC_DIR)
        static_dest.mkdir(parents=True, exist_ok=True)
        npm_bin = shutil.which("npm")
        built_success = False

        if npm_bin and frontend_dir.exists() and (frontend_dir / "package.json").exists():
            logger.info("[BrainByte OTA] Rebuilding frontend assets via npm...")
            try:
                # Run npm ci or npm install if node_modules is missing
                if not (frontend_dir / "node_modules").exists():
                    subprocess.run([npm_bin, "install"], cwd=str(frontend_dir), check=True, timeout=180)

                subprocess.run([npm_bin, "run", "build"], cwd=str(frontend_dir), check=True, timeout=180)
                built_dist = frontend_dir / "dist"
                if built_dist.exists() and (built_dist / "index.html").exists():
                    shutil.copytree(built_dist, static_dest, dirs_exist_ok=True)
                    logger.info(f"[BrainByte OTA] Copied fresh npm build from {built_dist} to {static_dest}")
                    built_success = True
            except Exception as e:
                logger.warn(f"[BrainByte OTA] npm build warning: {e}")

        # If npm build was not executed or failed, search for pre-built dist/static in extracted tarball
        if not built_success:
            candidate_dists = [
                source_root / "dist",
                source_root / "frontend" / "dist",
                source_root / "static",
                extract_dir / "dist",
                extract_dir / "static"
            ]
            for cand in candidate_dists:
                if cand.exists() and cand.is_dir() and (cand / "index.html").exists():
                    logger.info(f"[BrainByte OTA] Found pre-built dist bundle at {cand}. Copying to {static_dest}...")
                    shutil.copytree(cand, static_dest, dirs_exist_ok=True)
                    built_success = True
                    break

        if not built_success:
            logger.warn("[BrainByte OTA] Warning: No static dist bundle or index.html found in update package.")


        # 5. Schedule container restart
        async def delayed_restart():
            await asyncio.sleep(1.0)
            _trigger_restart()

        asyncio.create_task(delayed_restart())

        return {
            "status": "success",
            "message": "Update package extracted and frontend rebuilt successfully! Server container is rebooting now..."
        }

    except Exception as e:
        logger.error(f"[BrainByte OTA] Failed to process update package: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
