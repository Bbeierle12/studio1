export type Recipe = {
  id: string;
  title: string;
  contributor: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  imageHint: string;
  tags: string[];
  summary: string;
};

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};
