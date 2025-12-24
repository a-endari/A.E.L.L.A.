from fastapi import APIRouter, Response
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import urllib.parse
from app.services.obsidian import create_obsidian_zip

router = APIRouter()

class ObsidianRequest(BaseModel):
    cards: List[Dict[str, Any]]
    note_name: str = "My Vocabulary"
    source_lang: str = "de"
    target_lang: str = "en"
    secondary_lang: Optional[str] = None

@router.post("/download")
async def download_obsidian_zip(request: ObsidianRequest):
    zip_stream = await create_obsidian_zip(
        request.cards, 
        request.note_name,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        secondary_lang=request.secondary_lang
    )
    filename = f"{request.note_name.replace(' ', '_')}.zip"
    encoded_filename = urllib.parse.quote(filename)
    headers = {'Content-Disposition': f"attachment; filename*=UTF-8''{encoded_filename}"}
    return Response(content=zip_stream.read(), media_type="application/zip", headers=headers)
