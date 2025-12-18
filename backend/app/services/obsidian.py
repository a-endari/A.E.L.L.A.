import io
import zipfile
import aiohttp
import asyncio
from typing import List, Dict, Any, Optional

async def create_obsidian_zip(
    cards: List[Dict[str, Any]], 
    note_name: str = "My Vocabulary",
    source_lang: str = 'de',
    target_lang: str = 'en',
    secondary_lang: Optional[str] = None
) -> io.BytesIO:
    """
    Generates a ZIP file compatible with Obsidian.
    Contains:
    1. {NoteName}.md (The main note)
    2. README.md (Instructions)
    3. Media/ (Folder with MP3s)
    """
    # Language display names
    lang_names = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
        'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
        'ko': 'Korean', 'zh': 'Chinese', 'fa': 'Persian', 'tr': 'Turkish',
        'nl': 'Dutch', 'pl': 'Polish'
    }
    
    source_label = lang_names.get(source_lang, source_lang.upper())
    target_label = lang_names.get(target_lang, target_lang.upper())
    secondary_label = lang_names.get(secondary_lang, secondary_lang.upper()) if secondary_lang else None
    
    zip_buffer = io.BytesIO()
    
    display_title = note_name.title()
    
    words_md_content = f"# {display_title}\n\n"
    readme_content = """# Obsidian Export Guide

1.  **Extract** this zip file.

2.  Copy the markdown file and the `Media` folder into your Obsidian Vault.
3.  **Important**: Ensure Obsidian can see the media files.
    -   Go to **Settings > Files & Links**.
    -   Check "Default location for new attachments". If it's "Same folder as current file" or "In subfolder under current folder", you are good to go if you keep the structure.
    -   Ideally, just drag the `Media` folder into your vault.
    
## Callouts
This note uses Obsidian Callouts (e.g., `> [!NOTE]`). They are supported natively in recent Obsidian versions.
"""

    async with aiohttp.ClientSession() as session:
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            # Add README
            zf.writestr("README.md", readme_content)
            
            # Process cards
            for card in cards:
                clean_word = card.get('clean_word', 'Unknown')
                # Handle list of definitions (these are secondary definitions)
                definitions = card.get('definitions', [])
                if isinstance(definitions, str):
                    definitions = [definitions]
                definition_text = "\n".join([f"- {d}" for d in definitions])
                
                # Primary target definition
                target_def = card.get('english_definition', '')
                
                # Synonyms (only for German words typically)
                synonyms_list = card.get('synonyms', [])
                synonyms = ", ".join(synonyms_list) if synonyms_list else ""
                
                audio_url = card.get('audio_url')
                
                # Append to Words.md (Callout Format)
                words_md_content += f"> [!tldr]- {clean_word}\n"
                
                if audio_url:
                    filename = f"{clean_word}.mp3"
                    words_md_content += f"> ![[{filename}]]\n"
                    
                    # Download and add to zip
                    try:
                        async with session.get(audio_url) as resp:
                            if resp.status == 200:
                                audio_data = await resp.read()
                                zf.writestr(f"Media/{filename}", audio_data)
                    except Exception as e:
                        print(f"Failed to download audio for {clean_word}: {e}")
                
                # Per-card language labels
                c_target = card.get('target_lang', target_lang)
                c_secondary = card.get('secondary_lang', secondary_lang)
                
                curr_target_label = lang_names.get(c_target, c_target.upper()).upper()
                curr_secondary_label = lang_names.get(c_secondary, c_secondary.upper()).upper() if c_secondary else "SECONDARY"

                words_md_content += "> ---\n"
                words_md_content += f"> **{curr_target_label}**: {target_def}\n"
                words_md_content += f">\n"
                
                # Secondary language (if exists)
                if definition_text and curr_secondary_label:
                    words_md_content += "> ---\n"
                    formatted_secondary = definition_text.replace('\n', '\n> ')
                    words_md_content += f"> **{curr_secondary_label}**:\n> {formatted_secondary}\n"
                
                words_md_content += "> ---\n"
                
                # Only show synonyms if they exist
                if synonyms:
                     words_md_content += f"> **Synonyms**: {synonyms}\n"
                
                words_md_content += "\n"

            # Add Main Note
            zf.writestr(f"{display_title}.md", words_md_content)

    zip_buffer.seek(0)
    return zip_buffer
