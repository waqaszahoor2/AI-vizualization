"""
File upload router for dataset handling.
"""
import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings
from app.services.data_processor import data_processor

router = APIRouter(prefix="/api/upload", tags=["upload"])
logger = logging.getLogger(__name__)


@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV or Excel file and return its metadata."""
    try:
        if not data_processor.is_valid_file(file.filename):
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: csv, xlsx, xls")

        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File too large. Max: {settings.MAX_FILE_SIZE // 1024**2}MB")

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

        # Save with unique prefix
        file_id = str(uuid.uuid4())[:8]
        safe_name = f"{file_id}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

        with open(file_path, "wb") as f:
            f.write(content)

        # Profile dataset
        df = data_processor.load_file(file_path)
        profile = data_processor.profile_dataset(df)
        sample_data = data_processor.get_sample_data(df, n_rows=10)

        # Save metadata
        data_processor.save_dataset_metadata(file_path, profile)

        return {
            "success": True,
            "dataset_id": file_id,
            "file_name": file.filename,
            "file_path": file_path,
            "file_size": len(content),
            "metadata": profile,
            "sample_data": sample_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/preview/{file_name}")
async def get_file_preview(file_name: str, rows: int = 20):
    """Get a preview of a file's contents."""
    try:
        # Search for the file
        file_path = None
        for f in os.listdir(settings.UPLOAD_DIR):
            if file_name in f:
                file_path = os.path.join(settings.UPLOAD_DIR, f)
                break

        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        df = data_processor.load_file(file_path)
        profile = data_processor.profile_dataset(df)
        sample = data_processor.get_sample_data(df, n_rows=rows)
        stats = data_processor.get_statistics_summary(df)

        return {"file_name": file_name, "profile": profile, "statistics": stats, "sample_data": sample}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets")
async def list_datasets():
    """List all uploaded datasets."""
    try:
        datasets = []
        if os.path.exists(settings.UPLOAD_DIR):
            for f in os.listdir(settings.UPLOAD_DIR):
                if f.endswith((".csv", ".xlsx", ".xls")):
                    path = os.path.join(settings.UPLOAD_DIR, f)
                    datasets.append({
                        "file_name": f,
                        "file_path": path,
                        "file_size": os.path.getsize(path),
                    })
        return {"datasets": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
