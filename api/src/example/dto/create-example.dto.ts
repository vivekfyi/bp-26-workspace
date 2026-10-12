import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name!: string;
}
