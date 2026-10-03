import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, } from 'class-validator';
import { TaskPriority, TaskStatus, } from '../../generated/prisma/client';

export class CreateTaskDto {
    @ApiProperty({
        example: 'Preparar proposta comercial', 
        description: 'Task title', 
        minLength: 2, })
    @IsString()
    @MinLength(2)
    title!: string;
    
    @ApiPropertyOptional({
        example: 'Preparar e enviar a proposta para o cliente.',
        description: 'Task description', })
    @IsOptional()
    @IsString()
    description?: string;
    
    @ApiPropertyOptional({
         enum: TaskStatus,
         example: TaskStatus.TODO,
         description: 'Task status', })
    @IsOptional()
    @IsEnum(TaskStatus) status?: TaskStatus;
    
    @ApiPropertyOptional({
        enum: TaskPriority,
        example: TaskPriority.MEDIUM,
        description: 'Task priority', })
    @IsOptional()
    @IsEnum(TaskPriority) priority?: TaskPriority;
    
    @ApiPropertyOptional({
        example: '2026-10-01T18:00:00.000Z',
        description: 'Task due date', })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
    
    @ApiPropertyOptional({
        example: 1,
        description: 'Client associated with the task', })
    @IsOptional()
    @IsInt()
    @Min(1)
    clientId?: number;
}