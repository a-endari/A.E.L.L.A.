import genanki
import random
from typing import List, Dict, Any
from io import BytesIO

def create_deck(cards_data: List[Dict[str, Any]], deck_name: str = 'Universal Language Deck') -> BytesIO:
    """
    Generates an Anki deck (.apkg) from a list of word data objects.
    Returns: BytesIO object containing the .apkg file content.
    """
    # Unique Deck ID (random but consistent for this session)
    deck_id = random.randrange(1 << 30, 1 << 31)
    
    # Define the Model (Note Type)
    model = genanki.Model(
        1607392319,
        'Universal Language App Model',
        fields=[
            {'name': 'German'},
            {'name': 'English'},
            {'name': 'Persian'},
            {'name': 'Synonyms'},
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': '{{German}}',
                'afmt': '{{FrontSide}}<hr id="answer">{{English}}<br><br><div dir="rtl">{{Persian}}</div><br><small>{{Synonyms}}</small>',
            },
        ])

    deck = genanki.Deck(deck_id, deck_name)

    for card in cards_data:
        german = card.get('clean_word', '')
        english = card.get('english_definition', '')
        
        # Handle list of definitions
        definitions = card.get('definitions', [])
        if isinstance(definitions, str):
            definitions = [definitions]
        persian = "<br>".join([f"{i+1}. {d}" for i, d in enumerate(definitions)])
        synonyms = ", ".join(card.get('synonyms', []))
        
        note = genanki.Note(
            model=model,
            fields=[german, english, persian, synonyms]
        )
        deck.add_note(note)

    # Write to BytesIO
    out = BytesIO()
    package = genanki.Package(deck)
    package.write_to_file(out)
    out.seek(0)
    
    return out
