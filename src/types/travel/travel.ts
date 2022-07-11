export interface TravelInterface {
  id: string;
  title: string;
  description: string;
  destination: string;
  comradesCount: number;
  photoFn: string;
  startAt: string;
  endAt: string;
}

export type TravelSaveResponseData = Omit<TravelInterface, 'photoFn'> & {
  photo: string;
  authorId: string;
};
