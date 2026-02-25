export type Word = {
  id: string;
  word: string;
  definition: string;
  part_of_speech: string | null;
  pronunciation: string | null;
  source: string;
  notes: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type MWDefinition = {
  word: string;
  partOfSpeech: string;
  definitions: string[];
  pronunciation?: string;
};
