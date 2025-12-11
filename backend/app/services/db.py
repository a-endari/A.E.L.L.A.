import sqlite3
import json
from typing import List, Dict, Any

DB_PATH = "vocabulary.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if 'lists' table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='lists'")
    lists_exists = cursor.fetchone()
    
    if not lists_exists:
        print("Migrating database to Multi-List schema...")
        
        # 1. Create lists table
        cursor.execute('''
            CREATE TABLE lists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )
        ''')
        
        # 2. Create default 'General' list
        cursor.execute("INSERT INTO lists (name) VALUES (?)", ("General",))
        general_list_id = cursor.lastrowid
        
        # 3. Check if old 'cards' table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cards'")
        cards_exists = cursor.fetchone()
        
        if cards_exists:
            # Check if list_id column exists (it shouldn't if we are migrating, but safety first)
            # Actually, simpler to rename old table and create new one
            cursor.execute("ALTER TABLE cards RENAME TO cards_old")
            
            # Create new cards table
            cursor.execute('''
                CREATE TABLE cards (
                    clean_word TEXT NOT NULL,
                    list_id INTEGER NOT NULL,
                    data TEXT NOT NULL,
                    PRIMARY KEY (clean_word, list_id),
                    FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
                )
            ''')
            
            # Copy data
            cursor.execute('''
                INSERT INTO cards (clean_word, list_id, data)
                SELECT clean_word, ?, data FROM cards_old
            ''', (general_list_id,))
            
            # Drop old table
            cursor.execute("DROP TABLE cards_old")
            
        else:
            # Create new cards table from scratch
            cursor.execute('''
                CREATE TABLE cards (
                    clean_word TEXT NOT NULL,
                    list_id INTEGER NOT NULL,
                    data TEXT NOT NULL,
                    PRIMARY KEY (clean_word, list_id),
                    FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
                )
            ''')
            
    conn.commit()
    conn.close()

# --- List Operations ---
def get_lists() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    lists = conn.execute('SELECT * FROM lists').fetchall()
    conn.close()
    return [{"id": l["id"], "name": l["name"]} for l in lists]

def create_list(name: str):
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO lists (name) VALUES (?)', (name,))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False # duplicate name
    finally:
        conn.close()

def delete_list(list_id: int):
    conn = get_db_connection()
    conn.execute('PRAGMA foreign_keys = ON') # Ensure cascade works
    conn.execute('DELETE FROM lists WHERE id = ?', (list_id,))
    conn.commit()
    conn.close()

# --- Card Operations ---
def get_cards_for_list(list_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cards = conn.execute('SELECT data FROM cards WHERE list_id = ?', (list_id,)).fetchall()
    conn.close()
    return [json.loads(card['data']) for card in cards]

def add_card(list_id: int, card_data: Dict[str, Any]):
    conn = get_db_connection()
    clean_word = card_data.get('clean_word')
    if clean_word:
        try:
            conn.execute(
                'INSERT OR REPLACE INTO cards (clean_word, list_id, data) VALUES (?, ?, ?)',
                (clean_word, list_id, json.dumps(card_data))
            )
            conn.commit()
        except Exception as e:
            print(f"Error saving card: {e}")
    conn.close()

def delete_card(list_id: int, clean_word: str):
    conn = get_db_connection()
    conn.execute('DELETE FROM cards WHERE list_id = ? AND clean_word = ?', (list_id, clean_word))
    conn.commit()
    conn.close()

# Initialize DB on import (or calling init_db manually in main)
init_db()
