import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

const priorities = ['low', 'normal', 'high'] as const;

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsString()
  @IsIn(priorities)
  priority!: (typeof priorities)[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  message!: string;
}
