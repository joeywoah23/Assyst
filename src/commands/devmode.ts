import Command from '../../lib/Command';
import Assyst from '../../lib/Assyst';
import { COOLDOWN_TYPES, PERMISSION_LEVELS, MESSAGE_TYPE_EMOTES } from '../../lib/Enums';
import { ICommandContext } from '../../lib/CInterfaces';
import { Message } from 'detritus-client/lib/structures';


export default class Cmd extends Command {
    constructor(assyst: Assyst) {
        super({
            name: 'devmode',
            aliases: ['dm'],
            assyst,
            cooldown: {
                timeout: 0,
                type: COOLDOWN_TYPES.GUILD
            },
            permissionLevel: PERMISSION_LEVELS.OWNER,
            validFlags: [],
            info: {
                description: 'Toggle the dev-only mode of the bot',
                examples: [''],
                usage: "",
                author: "Jacherr"
            }
        });
    }

    public async execute(context: ICommandContext): Promise<Message | null> {
        if(this.bot.user?.presence?.status === 'online') {
            this.bot.gateway.setPresence({
                status: 'dnd'
            })
        } else {
            this.bot.gateway.setPresence({
                status: 'online'
            })
        }
        return context.reply('Toggled dev-only mode.', {
            storeAsResponseForUser: {
                user: context.message.author.id,
                message: context.message.id
            },
            type: MESSAGE_TYPE_EMOTES.SUCCESS
        })
    }
}