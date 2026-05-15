import { IsOptional, IsString, Matches, ValidateIf } from "class-validator";

export class UpdateNotificationsDto {
  @IsOptional()
  @ValidateIf((o: UpdateNotificationsDto) => o.phone !== null)
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: "phone must be E.164 format (e.g. +15551234567)" })
  phone?: string | null;
}

export interface AccountNotificationsResponse {
  email: string;
  emailSubscriptionStatus: string | null;
  phone: string | null;
}
