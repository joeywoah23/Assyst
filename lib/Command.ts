import { ICommandOptions, ICommandContext } from './CInterfaces'
import Assyst from './Assyst'
import { IInfo, IFlagInfo,  } from './Interfaces'
import { Message } from 'detritus-client/lib/structures'
import { PERMISSION_LEVELS } from './Enums';

export default class Command {
    public name: string;
    public permissionLevel: number;
    public timeout: number;
    public argsMin: number;
    public aliases: Array<string>;
    public validFlags: Array<IFlagInfo>;
    public nsfw: boolean;
    public visibleInHelp: boolean;
    public info: IInfo;
    public assyst: Assyst;

    constructor(options: ICommandOptions) {
        this.name = options.name;
        this.timeout = options.timeout;
        this.argsMin = options.argsMin || 0;
        this.aliases = options.aliases || [];
        this.info = options.info;
        if(options.visibleInHelp === undefined) {
            this.visibleInHelp = false
        } else {
            this.visibleInHelp = options.visibleInHelp
        }
        this.assyst = options.assyst;
        if(options.nsfw === undefined) {
            this.nsfw = false
        } else {
            this.nsfw = options.nsfw
        }
        this.validFlags = options.validFlags || [];
        this.permissionLevel = options.permissionLevel || PERMISSION_LEVELS.NORMAL;
    }

    public execute(context: ICommandContext): Promise<Message> {
        throw new Error('This function must be called from a class extension.');
    }
}