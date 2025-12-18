import genanki
import random
from typing import List, Dict, Any, Optional
from io import BytesIO

def create_deck(
    cards_data: List[Dict[str, Any]], 
    deck_name: str = 'Universal Language Deck',
    source_lang: str = 'de',
    target_lang: str = 'en',
    secondary_lang: Optional[str] = None
) -> BytesIO:
    """
    Generates an Anki deck (.apkg) from a list of word data objects.
    Returns: BytesIO object containing the .apkg file content.
    """
    # Language display names
    lang_names = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
        'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
        'ko': 'Korean', 'zh': 'Chinese', 'fa': 'Persian', 'tr': 'Turkish',
        'nl': 'Dutch', 'pl': 'Polish'
    }
    
    # We use these for the labels in the deck
    source_label = lang_names.get(source_lang, source_lang.upper())
    target_label = lang_names.get(target_lang, target_lang.upper())
    secondary_label = lang_names.get(secondary_lang, secondary_lang.upper()) if secondary_lang else None
    
    # Unique Deck ID
    deck_id = random.randrange(1 << 30, 1 << 31)
    
    # CSS for the card
    style = """
    .card {
     font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
     font-size: 20px;
     text-align: center;
     color: #0f172a;
     background-color: #f8fafc;
     height: 100vh;
     display: flex;
     flex-direction: column;
     justify-content: center;
     align-items: center;
     margin: 0;
     padding: 20px;
     box-sizing: border-box;
    }

    .container {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 40px;
      width: 100%;
      max-width: 600px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a855f7;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .word {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }

    .definition {
      font-size: 1.25rem;
      color: #334155;
      font-style: italic;
      line-height: 1.6;
    }

    .secondary {
      font-size: 1.25rem;
      color: #475569;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
    }

    .synonyms {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 12px;
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 8px;
    }

    .divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 20px 0;
      width: 100%;
    }

    .footer {
      margin-top: 30px;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    a {
      color: #a855f7;
      text-decoration: none;
      font-weight: 500;
    }

    /* Dark Mode */
    .nightMode .card {
      background-color: #020617;
      color: #e2e8f0;
    }
    
    .nightMode .container {
      background: #0f172a;
      border-color: #1e293b;
      box-shadow: none;
    }

    .nightMode .word { color: #f8fafc; }
    .nightMode .definition { color: #cbd5e1; }
    .nightMode .secondary { color: #94a3b8; border-color: #334155; }
    .nightMode .synonyms { background: #1e293b; color: #94a3b8; }
    .nightMode .divider { background: #1e293b; }
    """

    # Define the Model
    model = genanki.Model(
        1607392319,
        'Universal Language App Model V2',
        fields=[
            {'name': 'Source'},
            {'name': 'Target'},
            {'name': 'Secondary'},
            {'name': 'Synonyms'},
            {'name': 'SourceLabel'},
            {'name': 'TargetLabel'},
            {'name': 'SecondaryLabel'},
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': f"""
                <div class="container">
                  <div class="label">{{{{SourceLabel}}}}</div>
                  <div class="word">{{{{Source}}}}</div>
                </div>
                <div class="footer">
                   Created with <a href="https://github.com/a-endari/A.E.L.L.A.">A.E.L.L.A.</a>
                </div>
                """,
                'afmt': f"""
                <div class="container">
                  <div class="label">{{{{SourceLabel}}}}</div>
                  <div class="word">{{{{Source}}}}</div>
                  
                  {{{{#Synonyms}}}}
                  <div class="synonyms" style="margin-top: 16px; margin-bottom: 16px;">
                    <div style="font-size: 0.7rem; color: #a855f7; font-weight: 600; margin-bottom: 8px;">SYNONYMS</div>
                    <div style="font-size: 0.875rem;">{{{{Synonyms}}}}</div>
                  </div>
                  {{{{/Synonyms}}}}
                  
                  <div class="divider"></div>
                  
                  <div class="label">{{{{TargetLabel}}}}</div>
                  <div class="definition">{{{{Target}}}}</div>


                  {{{{#Secondary}}}}
                  <div class="divider" style="margin: 12px 0;"></div>
                  <div class="label">{{{{SecondaryLabel}}}}</div>
                  <div class="secondary">{{{{Secondary}}}}</div>
                  {{{{/Secondary}}}}
                </div>
                <div class="footer">
                   Created with <a href="https://github.com/a-endari/A.E.L.L.A.">A.E.L.L.A.</a>
                </div>
                """,
            },
        ],
        css=style)

    deck = genanki.Deck(deck_id, deck_name)

    for card in cards_data:
        source_word = card.get('clean_word', '')
        target_def = card.get('english_definition', '')  # This should be the primary target
        
        # Handle secondary definitions
        definitions = card.get('definitions', [])
        if isinstance(definitions, str):
            definitions = [definitions]
        secondary_def = "<br>".join([f"{i+1}. {d}" for i, d in enumerate(definitions)]) if definitions else ""
        
        # Only include synonyms if they exist
        synonyms_list = card.get('synonyms', [])
        synonyms = ", ".join(synonyms_list) if synonyms_list else ""

        # Language Labels (Persisted per card if possible, otherwise use deck defaults)
        c_source = card.get('source_lang', source_lang)
        c_target = card.get('target_lang', target_lang)
        c_secondary = card.get('secondary_lang', secondary_lang)

        s_label = lang_names.get(c_source, c_source.upper()).upper()
        t_label = lang_names.get(c_target, c_target.upper()).upper()
        sec_label = lang_names.get(c_secondary, c_secondary.upper()).upper() if c_secondary else "SECONDARY"
        
        note = genanki.Note(
            model=model,
            fields=[source_word, target_def, secondary_def, synonyms, s_label, t_label, sec_label]
        )
        deck.add_note(note)

    # Write to BytesIO
    out = BytesIO()
    package = genanki.Package(deck)
    package.write_to_file(out)
    out.seek(0)
    
    return out
