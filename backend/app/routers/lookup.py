from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio

from app.services.translation import translate_text_async, get_word_with_article_async
from app.services.synonyms import get_synonyms_async
from app.services.pronunciation import get_audio_url_async
from app.services.text_processing import remove_article
from app.constants import SUPPORTED_LANGUAGES
from app.services.audio import cleanup_unused_audio

router = APIRouter()

class WordRequest(BaseModel):
    word: str
    source_lang: str = "de" 
    target_lang: str = "en"
    secondary_lang: Optional[str] = None # Optional secondary language code

@router.post("/lookup")
async def lookup_word(request: WordRequest):
    raw_word = request.word.strip()
    if not raw_word:
        raise HTTPException(status_code=400, detail="Word cannot be empty")

    source = request.source_lang
    target = request.target_lang
    secondary = request.secondary_lang
    
    # Validate languages
    if source not in SUPPORTED_LANGUAGES:
        pass 

    # Clean word
    if source == 'de':
        clean_word = remove_article(raw_word)
    else:
        clean_word = raw_word

    # Prepare Tasks
    tasks = []
    
    # Task 1: Primary Definition (Source -> Target)
    tasks.append(translate_text_async(clean_word, source=source, target=target))

    # Task 2: Audio (Source Language)
    voice = SUPPORTED_LANGUAGES.get(source, {}).get("voice", "de-DE-KatjaNeural")
    tasks.append(get_audio_url_async(clean_word, voice=voice))

    # Task 3: Secondary Language (Optional)
    if secondary and secondary != target:
         tasks.append(translate_text_async(clean_word, source=source, target=secondary))
    elif secondary == target:
         tasks.append(asyncio.sleep(0, result="")) # Duplicate of primary
    else:
         tasks.append(asyncio.sleep(0, result=None))

    # Task 4: Synonyms (Source Language)
    tasks.append(get_synonyms_async(clean_word))

    # Task 5: Article Detection (Only for German source for now)
    if source == 'de':
        tasks.append(get_word_with_article_async(clean_word))
    else:
        tasks.append(asyncio.sleep(0, result=None))

    # Execute
    results = await asyncio.gather(*tasks)
    
    main_def = results[0]
    audio_data = results[1]
    extra_def = results[2] # Secondary definition
    synonyms = results[3]
    article_word = results[4]

    audio_url = audio_data.get("audio_url")
    audio_filename = audio_url.split('/')[-1] if audio_url else None
    
    if audio_filename:
        # Run in background to not block response
        asyncio.create_task(asyncio.to_thread(cleanup_unused_audio, audio_filename))

    final_display_word = article_word if article_word else clean_word
    
    definitions_list = [extra_def] if extra_def else []
    definitions_list = [d for d in definitions_list if d] # filter empty

    return {
        "original_word": raw_word,
        "clean_word": final_display_word,
        "definitions": definitions_list, 
        "english_definition": main_def, 
        "synonyms": synonyms,
        "audio_url": audio_url,
        "source_lang": source,
        "target_lang": target,
        "secondary_lang": secondary
    }
