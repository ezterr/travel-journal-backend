import { SetMetadata } from '@nestjs/common';

export const SetOwnerIdParamKey = (key: string) => SetMetadata('ownerParamKey', key);
