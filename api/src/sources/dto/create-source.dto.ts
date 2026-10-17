import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min, ArrayUnique } from 'class-validator';
import { ContentLicense } from '../../generated/prisma/enums.js';

export class CreateSourceDto {
  @IsString()
  name!: string;

  @IsUrl({ require_protocol: true })
  feedUrl!: string;

  @IsUrl({ require_protocol: true })
  siteUrl!: string;

  @IsString()
  category!: string;

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

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  topicSlugs!: string[];
}
