export interface CreatePostDtoInterface {
  title: string;
  destination: string;
  description: string;
  photo: string;
}

export interface UpdatePostDtoInterface {
  title?: string;
  destination?: string;
  description?: string;
  photo?: string;
}
