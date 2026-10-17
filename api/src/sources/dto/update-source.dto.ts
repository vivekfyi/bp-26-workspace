import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min, ArrayUnique } from 'class-validator';
import { ContentLicense } from '../../generated/prisma/enums.js';

export class UpdateSourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  feedUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  siteUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  trustScore?: number;

  @IsOptional()
  @IsEnum(ContentLicense)
  licenseType?: ContentLicense;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  topicSlugs?: string[];
}
