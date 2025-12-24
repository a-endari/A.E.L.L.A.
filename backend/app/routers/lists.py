from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.db import get_lists, create_list, delete_list, get_cards_for_list, add_card, delete_card, rename_list, update_card

router = APIRouter()

class ListCreate(BaseModel):
    name: str

class ListRename(BaseModel):
    name: str

@router.get("/")
async def read_lists():
    return get_lists()

@router.post("/")
async def create_new_list(list_data: ListCreate):
    success = create_list(list_data.name)
    if not success:
        raise HTTPException(status_code=400, detail="List already exists")
    return {"status": "created", "name": list_data.name}

@router.delete("/{list_id}")
async def remove_list(list_id: int):
    delete_list(list_id)
    return {"status": "deleted", "id": list_id}

@router.put("/{list_id}")
async def update_list(list_id: int, data: ListRename):
    success = rename_list(list_id, data.name)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot rename General list or name already exists")
    return {"status": "renamed", "id": list_id, "name": data.name}

@router.get("/{list_id}/cards")
async def read_list_cards(list_id: int):
    return get_cards_for_list(list_id)

@router.post("/{list_id}/cards")
async def save_card_to_list(list_id: int, card: dict):
    if add_card(list_id, card):
        return {"status": "success", "word": card.get("clean_word")}
    else:
        # 409 Conflict for duplicates
        raise HTTPException(status_code=409, detail="Card already exists in this list")

@router.delete("/{list_id}/cards/{word}")
async def remove_card_from_list(list_id: int, word: str):
    delete_card(list_id, word)
    return {"status": "deleted", "word": word}

@router.put("/{list_id}/cards/{word}")
async def update_card_in_list(list_id: int, word: str, card: dict):
    if update_card(list_id, word, card):
        return {"status": "updated", "word": word}
    else:
        raise HTTPException(status_code=404, detail="Card not found")
