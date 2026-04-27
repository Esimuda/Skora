import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { UpsertScoreDto } from './upsert-score.dto';

export class UpsertScoresBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertScoreDto)
  scores: UpsertScoreDto[];
}
