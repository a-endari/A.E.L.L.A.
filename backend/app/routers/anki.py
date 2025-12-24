from fastapi import APIRouter, Response
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import urllib.parse
from app.services.anki import create_deck

router = APIRouter()

class AnkiRequest(BaseModel):
    cards: List[Dict[str, Any]]
    deck_name: str = "My Vocabulary"
    source_lang: str = "de"
    target_lang: str = "en"
    secondary_lang: Optional[str] = None

@router.post("/download")
async def download_anki_deck(request: AnkiRequest):
    deck_stream = create_deck(
        request.cards, 
        request.deck_name,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        secondary_lang=request.secondary_lang
    )
    filename = f"{request.deck_name.replace(' ', '_')}.apkg"
    encoded_filename = urllib.parse.quote(filename)
    headers = {'Content-Disposition': f"attachment; filename*=UTF-8''{encoded_filename}"}
    return Response(content=deck_stream.read(), media_type="application/octet-stream", headers=headers)
