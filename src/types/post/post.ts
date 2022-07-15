export interface PostInterface {
  id: string;
  title: string;
  destination: string;
  description: string;
  createdAt: Date;
  photoFn: string;
}

export type PostSaveResponseData = Omit<PostInterface, 'photoFn'> & {
  photo: string;
  authorId: string;
  travelId: string;
};
