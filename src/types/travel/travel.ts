export interface TravelInterface {
  id: string;
  title: string;
  description: string;
  destination: string;
  comradesCount: number;
  photoFn: string;
  travelStartAt: string;
  travelEndAt: string;
}

export type TravelSaveResponseData = Omit<TravelInterface, 'photoFn'> & {
  photo: string;
  authorId: string;
};
