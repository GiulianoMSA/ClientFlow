import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength, } from 'class-validator';
import { TaskPriority, TaskStatus, } from '../../generated/prisma/client';
export class UpdateTaskDto { 
    @ApiPropertyOptional({ 
        example: 'Enviar proposta comercial', 
        description: 'Task title', 
        minLength: 2, }) 
    @IsOptional() 
    @IsString() 
    @MinLength(2) 
    title?: string; 
    
    @ApiPropertyOptional({ 
        example: 'Proposta revisada e pronta para envio.', 
        description: 'Task description', }) 
    @IsOptional() 
    @IsString() 
    description?: string | null; 
    
    @ApiPropertyOptional({ 
        enum: TaskStatus, 
        example: TaskStatus.IN_PROGRESS, 
        description: 'Task status', }) 
    @IsOptional() 
    @IsEnum(TaskStatus) status?: TaskStatus; 
    
    @ApiPropertyOptional({ 
        enum: TaskPriority, 
        example: TaskPriority.HIGH, 
        description: 'Task priority', }) 
    @IsOptional() 
    @IsEnum(TaskPriority) priority?: TaskPriority; 
    
    @ApiPropertyOptional({ 
        example: '2026-10-05T18:00:00.000Z', 
        description: 'Task due date. Use null to remove the due date.', }) 
    @IsOptional() 
    @IsDateString() 
    dueDate?: string | null; 
    
    @ApiPropertyOptional({ 
        example: 1, 
        description: 'Client associated with the task. Use null to remove the association.', }) 
    @IsOptional() 
    @IsInt() 
    @Min(1) 
    clientId?: number | null;
}