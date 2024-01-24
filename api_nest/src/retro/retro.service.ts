import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Model, Types } from 'mongoose';

import { TeamService } from 'src/team/team.service';
import { JwtService } from '@nestjs/jwt';
import { sendRetroMail } from 'common/utils/emailRetro';
import { InjectSendGrid, SendGridService } from '@ntegral/nestjs-sendgrid';
import { MembersService } from 'src/members/members.service';
import { InjectModel } from '@nestjs/mongoose';
import { Member } from 'src/members/entities/member.entity';
import axios from 'axios';
import { MailerService } from '@nestjs-modules/mailer';
import { Team } from 'src/team/entities/team.entity';
type SocketId = string;
interface Vote {
  user_id: string;
  value: 'thumb_up' | 'thumb_down';
}

type StickyNote = {
  user_id: string;
  team_id: string;
  column: string;
  value: string;
  thumb_up: number;
  thumb_down: number;
  votes: any[];
};
interface Retro {
  id: string;
}
@Injectable({ scope: Scope.DEFAULT })
export class RetroService {
  private connectedClients: Map<SocketId, string> = new Map();
  private stickyNotes: Map<string, Map<string, StickyNote[]>> = new Map();
  private retros: Map<string, Retro> = new Map();
  private scrumMasterTeamMap: Record<string, string> = {};
  private retroStartedTeams: Set<string> = new Set();

  constructor(
    private readonly mailerService: MailerService,
    private readonly teamService: TeamService,
    private readonly memberService: MembersService,
    private readonly jwtService: JwtService,
    @InjectModel(Member.name) private readonly memberModel: Model<Member>,
    @InjectModel(Team.name) private readonly teamModel: Model<Member>,
    @InjectSendGrid() private readonly sendGrid: SendGridService,
  ) {}

  async registerClient(client: Socket, user_id: string) {
    this.connectedClients.set(client.id, user_id);
  }

  removeClient(client: Socket) {
    this.connectedClients.delete(client.id);
  }
  async getStickyNote(
    user_id: string,
    team_id: string,
    column: string,
    value: string,
  ): Promise<StickyNote | undefined> {
    const teamNotes = this.stickyNotes.get(team_id);
    if (!teamNotes) {
      return undefined;
    }

    const columnNotes = teamNotes.get(column);
    if (!columnNotes) {
      return undefined;
    }

    return columnNotes.find(
      (note) => note.user_id === user_id && note.value === value,
    );
  }

  isClientRegistered(client: Socket): boolean {
    return this.connectedClients.has(client.id);
  }

  getConnectedClients(): number {
    return this.connectedClients.size;
  }
  getClients() {
    return this.connectedClients;
  }
  getClientUserId(client: Socket) {
    return this.connectedClients.get(client.id);
  }
  startRetro(teamId: string) {
    this.retroStartedTeams.add(teamId);
    console.log(this.retros);
  }

  // Método para completar la retro
  async completeRetro(teamId: string) {
    this.stickyNotes.delete(teamId);
    this.retroStartedTeams.delete(teamId);
    this.connectedClients.clear();
    this.retros.delete(teamId);
  }

  // Método para verificar si la retro ha comenzado para un equipo
  isRetroStarted(teamId: string): boolean {
    const team_id = teamId.toString();
    console.log(this.retroStartedTeams.has(team_id));

    return this.retroStartedTeams.has(team_id);
  }
  async createRetro(data: any) {
    console.log(data);

    try {
      const { token, team_id, scrum_id } = data;
      this.startRetro(team_id);
      console.log(scrum_id);
      const convertedTeamId = new Types.ObjectId(team_id);
      const tokenWithoutQuotes = token.replace(/^"|"$/g, '');

      const team = await this.teamService.searchTeam(convertedTeamId);

      console.log(team);

      if (team) {
        const { scrumId } = team;
        this.scrumMasterTeamMap[scrumId] = team_id;
        const teamIdString = team_id.toString();
        this.retros.set(teamIdString, teamIdString);

        console.log(this.retros);
      }

      const retroUrl = `https://esencia.app/members/retro?token=${tokenWithoutQuotes}&team_id=${team_id}&scrum_id=${scrum_id}`;
      console.log(retroUrl);

      return retroUrl;
    } catch (error) {
      console.log(error);
    }
  }

  clearTeamIdForRetro(team_id: string): void {
    // Eliminar la asociación del team_id para la retro actual
    console.log(team_id);

    this.retroStartedTeams.delete(team_id);
  }

  async rateStickyNote(
    user_id: string,
    team_id: string,
    column: string,
    vote: string,
    value: string,
  ) {
    const stickyNote =
      this.findStickyNote(user_id, team_id, column, value) ||
      this.createStickyNote(user_id, team_id, column, value);

    const existingVoteIndex = stickyNote.votes.findIndex(
      (v) => v.user_id === user_id,
    );

    if (existingVoteIndex !== -1) {
      const existingVote = stickyNote.votes[existingVoteIndex];

      stickyNote.votes.splice(existingVoteIndex, 1);

      if (existingVote.value === 'thumb_up') {
        stickyNote.thumb_up = Math.max(0, stickyNote.thumb_up - 1);
      } else if (existingVote.value === 'thumb_down') {
        stickyNote.thumb_down = Math.max(0, stickyNote.thumb_down - 1);
      }
    }

    stickyNote.votes.push({
      user_id,
      value: vote as 'thumb_up' | 'thumb_down',
    });

    if (vote === 'thumb_up') {
      stickyNote.thumb_up += 1;
      console.log(stickyNote);
    } else if (vote === 'thumb_down') {
      stickyNote.thumb_down += 1;
      console.log(stickyNote);
    }

    console.log(this.stickyNotes);
    return stickyNote;
  }

  saveStickyNote(
    user_id: string,
    team_id: string,
    column: string,
    value: string,
  ) {
    const newStickyNote: StickyNote = {
      user_id,
      team_id,
      column,
      value,
      thumb_up: 0,
      thumb_down: 0,
      votes: [],
    };

    this.updateStickyNotesInMemory(team_id, column, newStickyNote);
    return { message: 'Sticky note saved successfully' };
  }

  getAllStickyNotes(team_id: string) {
    const stickyNotesMap = this.stickyNotes.get(team_id);
    const allStickyNotes: StickyNote[] = [];

    if (stickyNotesMap) {
      stickyNotesMap.forEach((notes, column) => {
        allStickyNotes.push(...notes);
      });
    }

    return allStickyNotes;
  }
  async completeRetroAndSendStickyNotes(team_id: string) {
    const stickyNotesMap = this.stickyNotes.get(team_id);
    const convertedTeamId = new Types.ObjectId(team_id);
    try {
      const resp = await this.teamModel.findOneAndUpdate(
        convertedTeamId,
        { $inc: { sprint: 1 } }, // Utiliza $inc para incrementar el valor del campo
        { new: true }, // Devuelve el documento actualizado
      );
      console.log(resp);
    } catch (error) {
      console.log(error);
    } finally {
      const allColumns = ['c1', 'c2', 'c3', 'c4'];

      const formattedStickyNotes = Object.fromEntries(
        allColumns.map((column) => [
          column,
          (stickyNotesMap?.get(column) || []).map(
            ({ value, thumb_up, thumb_down }) => ({
              value,
              thumb_up,
              thumb_down,
            }),
          ),
        ]),
      );

      console.log({ ...formattedStickyNotes });
    }

    // try {
    //   // const resp = await axios.post(
    //   //   `https://us-central1-esencia-app.cloudfunctions.net/retro`,
    //   //   { ...formattedStickyNotes, team_id, sprint: 1 },
    //   console.log('Enviando retro a la api');
    // } catch (error) {
    //   console.log(error);
    // }
  }
  private updateStickyNotesInMemory(
    team_id: string,
    column: string,
    newStickyNote: StickyNote,
  ) {
    if (!this.stickyNotes.has(team_id)) {
      this.stickyNotes.set(team_id, new Map());
    }

    const teamNotesMap = this.stickyNotes.get(team_id);

    if (!teamNotesMap.has(column)) {
      teamNotesMap.set(column, []);
    }

    const columnNotes = teamNotesMap.get(column);
    columnNotes.push(newStickyNote);
  }

  private findStickyNote(
    user_id: string,
    team_id: string,
    column: string,
    value: string,
  ): StickyNote | undefined {
    const stickyNotesMap = this.stickyNotes.get(team_id);

    if (stickyNotesMap && stickyNotesMap.has(column)) {
      const columnNotes = stickyNotesMap.get(column);
      return columnNotes.find(
        (note) => note.value === value && note.column === column,
      );
    }

    return undefined;
  }

  isValidTeamId = (team_id) => {
    return Types.ObjectId.isValid(team_id);
  };

  async sendEmailToMembers(teamId) {
    console.log({ este: teamId });

    this.isValidTeamId(teamId);
    try {
      const teams = await this.teamService.searchTeam(teamId);

      if (teams) {
        console.log(teams);

        const convertedTeamId = new Types.ObjectId(teamId);
        const members = await this.memberModel.find({
          teamId: convertedTeamId,
        });
        console.log(members);

        if (members) {
          for (const member of members) {
            const token = this.jwtService.sign(
              { sub: member._id },
              { secret: process.env.JWT_SECRET_KEY },
            );
            const convertedUserId = new Types.ObjectId(member._id);
            console.log({ UserId: convertedUserId });

            const emailData = await sendRetroMail(
              token,
              teamId,
              member.name,
              member.email,
              convertedUserId,
            );

            await this.sendGrid.send(emailData);
            // this.mailerService.sendMail({
            //   to: member.email,
            //   from: process.env.EMAIL_USER,
            //   subject: 'Retro',
            //   template: 'retro',
            // });
          }
        }
      }
      return {
        message: `Retro sent to team: ${teamId}`,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async getTeamLength(teamId) {
    console.log(teamId);
    const convertedTeamId = new Types.ObjectId(teamId);
    const teams = await this.memberModel.find({ teamId: convertedTeamId });
    console.log(Object.keys(teams).length);

    return Object.keys(teams).length + 1;
  }
  async getTeamIdByUserId(user_id) {
    try {
      const convertedUserId = new Types.ObjectId(user_id);
      const member = await this.memberModel.findById(convertedUserId);

      if (member) {
        const { teamId } = member;
        return teamId;
      } else {
        throw new Error(`Member not found for user_id: ${user_id}`);
      }
    } catch (error) {
      console.error(`Error getting teamId by userId: ${error.message}`);
      throw error;
    }
  }

  async getUserById(user_id: string) {
    console.log(user_id);

    if (user_id && user_id !== 'null') {
      try {
        const convertedUserId = new Types.ObjectId(user_id);
        const member = await this.memberModel.findById(convertedUserId);
        return member;
      } catch (error) {
        console.log(error);
      }
    }
    return;
  }

  async deleteStickyNoteByContent(
    user_id: string,
    team_id: string,
    noteContent: string,
  ) {
    try {
      if (!this.isValidTeamId(team_id)) {
        throw new BadRequestException('Invalid teamId');
      }

      const stickyNotesMap = this.stickyNotes.get(team_id);

      if (stickyNotesMap) {
        stickyNotesMap.forEach((notes, column) => {
          const indexToDelete = notes.findIndex(
            (note) => note.value === noteContent && note.user_id === user_id,
          );

          if (indexToDelete !== -1) {
            notes.splice(indexToDelete, 1);
          }
        });
      }
    } catch (error) {
      console.error('Error deleting sticky note by content:', error);
      throw error;
    }
  }

  private createStickyNote(
    user_id: string,
    team_id: string,
    column: string,
    value: string,
  ): StickyNote {
    const newStickyNote: StickyNote = {
      user_id,
      team_id,
      column,
      value,
      thumb_up: 0,
      thumb_down: 0,
      votes: [],
    };

    this.updateStickyNotesInMemory(team_id, column, newStickyNote);
    return newStickyNote;
  }
}
