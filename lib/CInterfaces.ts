import { ShardClient } from 'detritus-client';
import Command from './Command';
import { Message, Channel, Guild } from 'detritus-client/lib/structures';
import { IFlagInfo, IInfo, IFlag, ICooldownType, ISendMsgOptions } from './Interfaces';
import Config from './Config';
import Assyst from './Assyst';
import { PERMISSION_LEVELS } from './Enums';

export type DefiniteMessage = Message & {
    // we are returning from handleMessage function if channel or guild is null
    // so we can safely assume that channel and guild object is not null
    channel: Channel,
    guild: Guild
};

export interface IAssystOptions {
    config: Config,
    bot?: ShardClient
}
export interface ICommandOptions {
    name: string,
    cooldown: ICooldownType,
    info: IInfo,
    assyst: Assyst
    permissionLevel?: PERMISSION_LEVELS,
    aliases?: Array<string>,
    validFlags?: Array<IFlagInfo>,
    nsfw?: boolean,
    visibleInHelp?: boolean,
    argsMin?: number,
    canBeDisabled?: boolean
}
export interface ICommandContext {
    args: string[],
    message: DefiniteMessage,
    reply: (message: string | object, options?: ISendMsgOptions) => Promise<Message | null>
    flags: Array<IFlag>,
    getFlag: (flagName: string) => IFlag | null,
    checkForFlag: (flagName: string) => boolean
}
export interface ITraceOptions {
    guild: string,
    thrownAt: Date,
    command: Command,
    context: ICommandContext,
    error: Error
}