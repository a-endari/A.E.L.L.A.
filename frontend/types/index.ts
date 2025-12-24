export interface WordData {
    original_word: string;
    clean_word: string;
    definitions: string[];
    english_definition: string;
    synonyms: string[];
    audio_url: string | null;
    last_review?: string;
    source_lang?: string;
    target_lang?: string;
    secondary_lang?: string;
}

export interface ListData {
    id: number;
    name: string;
}
