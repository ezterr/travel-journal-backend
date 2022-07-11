export interface Post {
  id: string;
  title: string;
  destination: string;
  description: string;
  createdAt: string;
  photoFn: string;
}

export type PostSaveResponseData = Omit<Post, 'photoFn'> & {
  photo: string;
  authorId: string;
};
