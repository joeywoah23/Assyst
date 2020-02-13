import Command from '../../lib/Command';
import Assyst from '../../lib/Assyst';
import { PERMISSION_LEVELS, REQUEST_TYPES, COOLDOWN_TYPES } from '../../lib/Enums';
import { ICommandContext } from '../../lib/CInterfaces';
import { Message } from 'detritus-client/lib/structures';
import superagent from 'superagent';

export default class DetritusDocs extends Command {
    constructor(assyst: Assyst) {
        super({
            name: 'detritusdocs',
            aliases: [ 'dd' ],
            argsMin: 1,
            assyst,
            cooldown: {
                timeout: 5000,
                type: COOLDOWN_TYPES.USER
            },
            validFlags: [
                {
                    name: 'type',
                    description: 'The data type to seach for',
                    argumented: true,
                    permissionLevel: PERMISSION_LEVELS.NORMAL,
                    accepts: [
                        'interface',
                        'class'
                    ]
                }
            ],
            info: {
                description: 'Get information on an interface or class for detritusjs',
                examples: ['ShardClient', 'CallOptions --type interface', 'Message --type class'],
                usage: "[class|interface]",
                author: "a"
            }
        });
    }

    public async execute(context: ICommandContext): Promise<Message | null> {
        //const response: superagent.Response | undefined = await this.request(`${this.assyst.apis.detritusDocsSearch}?query=${encodeURIComponent(context.args[0])}`, REQUEST_TYPE.GET)
        //    .then(v => v?.body);

        const pages: any[] = ["test1", "test2"];

        const paginator = await this.assyst.paginator.createReactionPaginator({
            reactions: this.assyst.reactions,
            pages,
            message: context.message
        });

        
        return null;
    }
}