import { CommandClient, CommandClientOptions } from 'detritus-client';

import Utils from './Utils';

import { Pool, QueryResult } from 'pg';

import { readdirSync } from 'fs';

import {
  db,
  webhooks
} from '../../config.json';
import RestController from '../rest/Rest';
import Logger from './Logger';
import { Context } from 'detritus-client/lib/command';
import { Markup } from 'detritus-client/lib/utils';
import AssystApi from '../api/Api';
import { BaseCollection } from 'detritus-client/lib/collections';

interface FoundCommandRow {
  uses: number,
  command: string
}

interface Metrics {
  eventRate: number,
  commands: number
}

export default class Assyst extends CommandClient {
    public db: Pool
    public customRest: RestController
    public logger: Logger
    public api: AssystApi
    public utils: Utils
    public metrics!: Metrics

    public prefixCache: BaseCollection<string, string>

    private metricsInterval!: NodeJS.Timeout

    constructor (token: string, options: CommandClientOptions) {
      super(token || '', options);
      this.db = new Pool(db);
      this.customRest = new RestController(this);
      this.logger = new Logger();
      this.api = new AssystApi(this);
      this.utils = new Utils(this);
      this.prefixCache = new BaseCollection({
        expire: 3600000
      });
      this.initMetricsChecks();
      this.loadCommands();
    }

    public sql (query: string, values?: any[]): Promise<QueryResult> {
      return new Promise((resolve, reject) => {
        this.db.query(query, values || [], (err: any, res: any) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
    }

    private loadCommands () {
      const files = readdirSync('./src/commands');
      files.forEach(async (file: string) => {
        if (file.includes('template')) return;
        const command: any = await import(`../commands/${file}`).then((v: any) => v.default);
        this.add({
          ...command,

          disableDm: true,

          run: command.run.bind(null, this),

          onRatelimit: (ctx: Context, ratelimits: any[]) => {
            if (ratelimits[0].item.replied === false) {
              ctx.editOrReply(`Cooldown - you need to wait ${(ratelimits[0].remaining / 1000).toFixed(2)} seconds.`);
              ratelimits[0].item.replied = true;
            }
            console.log(ratelimits);
          },

          onRunError: (ctx: Context, _args: any, error: any) => {
            ctx.editOrReply(Markup.codeblock(`Error: ${error.message}`, { language: 'js', limit: 1990 }));
            this.fireErrorWebhook(webhooks.commandOnError.id, webhooks.commandOnError.token, 'Command Run Error Fired', 0xDD5522, error);
          },

          onError: (ctx: Context, _args: any, error: any) => {
            ctx.editOrReply(Markup.codeblock(`Error: ${error.message}`, { language: 'js', limit: 1990 }));
            this.fireErrorWebhook(webhooks.commandOnError.id, webhooks.commandOnError.token, 'Command Error Fired', 0xBBAA00, error);
          },

          onTypeError: (ctx: Context, _args: any, error: any) => {
            ctx.editOrReply(Markup.codeblock(`Error: ${error.message}`, { language: 'js', limit: 1990 }));
            this.fireErrorWebhook(webhooks.commandOnError.id, webhooks.commandOnError.token, 'Command Type Error Fired', 0xCC2288, error);
          },

          onSuccess: async (ctx: Context) => {
            if (!ctx.command) return;
            const registeredCommandUses: FoundCommandRow[] = await this.sql('select command, uses from command_uses where guild = $1', [ctx.guildId]).then((r: QueryResult) => r.rows);
            this.metrics.commands++;
            const foundCommand: FoundCommandRow | undefined = registeredCommandUses.find((c: FoundCommandRow) => c.command === ctx.command?.name);
            if (!foundCommand) {
              await this.sql('insert into command_uses("guild", "command", "uses") values ($1, $2, $3)', [ctx.guildId, ctx.command.name, 1]);
            } else {
              foundCommand.uses++;
              await this.sql('update command_uses set uses = $1 where guild = $2 and command = $3', [foundCommand.uses, ctx.guildId, foundCommand.command]);
            }
          }
        });
        this.logger.info(`Loaded command: ${command.name}`);
      });
    }

    public fireErrorWebhook (id: string, token: string, title: string, color: number, error: any): void {
      this.client.rest.executeWebhook(id, token, {
        embed: {
          title,
          color,
          description: error.message,
          fields: [
            {
              name: 'Stack',
              value: `\`\`\`js\n${error.stack}\`\`\``,
              inline: false
            }
          ]
        }
      });
    }

    public async onPrefixCheck (ctx: Context) {
      if (!ctx.user.bot && ctx.guildId) {
        let prefix = this.prefixCache.get(ctx.guildId);
        if (!prefix) {
          prefix = await this.sql('select prefix from prefixes where guild = $1', [ctx.guildId]).then((r: QueryResult) => r.rows[0].prefix);
          if (!prefix) {
            await this.sql('insert into prefixes(prefix, guild) values($1, $2)', ['a-', ctx.guildId]);
            prefix = 'a-';
          }
        }
        return prefix;
      }
      return this.prefixes.custom;
    }

    private async initMetricsChecks (): Promise<void> {
      const metrics = await this.sql('select * from metrics').then((r: QueryResult) => r.rows);
      const commands = metrics.find((m) => m.name === 'commands').value;
      const eventRate = metrics.find((m) => m.name === 'last_event_count').value;
      let eventsThisMinute: number = 0;
      this.metrics = {
        commands,
        eventRate
      };
      this.client.on('raw', () => {
        eventsThisMinute++;
      });
      this.metricsInterval = setInterval(() => {
        this.metrics.eventRate = eventsThisMinute;
        eventsThisMinute = 0;
        this.sql(`update metrics set value = ${this.metrics.commands} where name = 'commands'; update metrics set value = ${this.metrics.eventRate} where name = 'last_event_count'`);
      }, 60000);
      this.logger.info('Initialised metrics checks');
    }
}
