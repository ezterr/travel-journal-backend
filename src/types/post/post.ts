export interface PostInterface {
  id: string;
  title: string;
  destination: string;
  description: string;
  createdAt: string;
  photoFn: string;
}

export type PostSaveResponseData = Omit<PostInterface, 'photoFn'> & {
  photo: string;
  authorId: string;
  travelId: string;
};
