import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'src/members/entities/member.entity';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';
import { JwtService } from '@nestjs/jwt';
import { sendMail } from 'common/utils/emailData';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { Survey } from './entities/survey.entity';
import { TeamService } from 'src/team/team.service';
@Injectable()
export class SurveyService {
  constructor(
    @InjectModel(Member.name) private readonly memberModel: Model<Member>,
    @InjectModel(Survey.name) private readonly surveyModel: Model<Survey>,

    @InjectSendGrid() private readonly client: SendGridService,
    private readonly jwtService: JwtService,
    private readonly teamService: TeamService,
  ) {}

  async createNewSurvey(teamId) {
    const convertedTeamId = new Types.ObjectId(teamId);
    const members = await this.memberModel.find({ teamId: convertedTeamId });

    try {
      for (const member of members) {
        const token = this.jwtService.sign(
          { sub: member._id },
          { secret: process.env.JWT_SECRET_KEY },
        );
        const convertedUserId = new Types.ObjectId(member._id);
        const emailData = await sendMail(
          token,
          teamId,
          member.name,
          member.email,
          convertedUserId,
        );
        await this.client.send(emailData);
      }
      return {
        payload: `Survey sent to ${teamId} successfully`,
      };
    } catch (error) {
      console.log(error);

      throw new BadRequestException(error.message);
    }
  }

  async postSurvey(createSurveyDto: CreateSurveyDto) {
    const convertedTeamId = new Types.ObjectId(createSurveyDto.team_id);
    const convertedUserId = new Types.ObjectId(createSurveyDto.user_id);
    try {
      const team = await this.teamService.searchTeam(convertedTeamId);
      if (!team)
        throw new BadRequestException(
          `The team ${createSurveyDto.team_id} does not exist`,
        );
      await axios.post(process.env.API_DATA + '/daily_survey', createSurveyDto);
      await this.surveyModel.create({
        ...createSurveyDto,
        userId: convertedUserId,
        teamId: convertedTeamId,
        date: new Date(),
      });
      return {
        created: 'ok',
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}