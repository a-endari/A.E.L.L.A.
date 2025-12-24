import os
from app.services.db import get_lists, get_cards_for_list

def cleanup_unused_audio(current_audio_file: str = None):
    """
    Deletes audio files in static/audio that are NOT in the saved vocabulary
    AND are NOT the current audio file being played.
    """
    try:
        audio_dir = "static/audio"
        if not os.path.exists(audio_dir):
            return

        # 1. Get all saved words from all lists to determine "saved" filenames
        lists = get_lists()
        saved_files = set()
        
        for lst in lists:
            cards = get_cards_for_list(lst['id'])
            for card in cards:
                audio_url = card.get('audio_url')
                if audio_url:
                    filename = audio_url.split('/')[-1]
                    saved_files.add(filename)

        # 2. Add current file to kept list
        if current_audio_file:
            saved_files.add(current_audio_file)

        # 3. Iterate and delete
        deleted_count = 0
        for filename in os.listdir(audio_dir):
            if filename.endswith(".mp3"):
                if filename not in saved_files:
                    os.remove(os.path.join(audio_dir, filename))
                    deleted_count += 1
        
        if deleted_count > 0:
            print(f"Cleanup: Deleted {deleted_count} temporary audio files.")

    except Exception as e:
        print(f"Error during audio cleanup: {e}")
