import { TravelSaveResponseData } from './travel';

export type GetTravelResponse = TravelSaveResponseData;
export type GetTravelsResponse = {
  travels: TravelSaveResponseData[];
  totalPages: number;
  totalTravelsCount: number;
};
export type UpdateTravelResponse = TravelSaveResponseData;
export type CreateTravelResponse = TravelSaveResponseData;
export type DeleteTravelResponse = TravelSaveResponseData;
