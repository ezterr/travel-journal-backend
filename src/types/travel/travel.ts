export interface TravelInterface {
  id: string;
  title: string;
  description: string;
  destination: string;
  comradesCount: number;
  photoFn: string;
  startAt: Date;
  endAt: Date;
}

export type TravelSaveResponseData = Omit<TravelInterface, 'photoFn'> & {
  photo: string;
  authorId: string;
};
