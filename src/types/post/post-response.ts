import { PostSaveResponseData } from './post';

export type GetPostResponse = PostSaveResponseData;
export type GetPostsResponse = {
  posts: PostSaveResponseData[];
  totalPages: number;
  totalPostsCount: number;
};
export type CreatePostResponse = PostSaveResponseData;
export type DeletePostResponse = PostSaveResponseData;
