import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SprintreportService } from './sprintreport.service';
import { CreateSprintreportDto } from './dto/create-sprintreport.dto';
import { UpdateSprintreportDto } from './dto/update-sprintreport.dto';

@Controller('sprintreport')
export class SprintreportController {
  constructor(private readonly sprintreportService: SprintreportService) {}

  @Get(':teamid')
  getAllTeamReports(@Param('teamid') teamId: string) {
    console.log(teamId);
    return this.sprintreportService.getAllTeamReports(teamId);
  }

  @Post(':teamid/:sprint')
  createSprintReport(
    @Param('teamid') teamId: string,
    @Param('sprint') sprint: string,
  ) {
    return this.sprintreportService.createSprintReport(teamId, sprint);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sprintreportService.remove(+id);
  }
}
