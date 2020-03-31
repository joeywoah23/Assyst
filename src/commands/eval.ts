import { Context, Command } from 'detritus-client/lib/command';

import { inspect } from 'util';

import Assyst from '../structures/Assyst';

import { Utils } from 'detritus-client';

const { Markup } = Utils;

export default {
  name: 'eval',
  aliases: ['e'],
  responseOptional: true,
  metadata: {
    description: 'Evaluate some code',
    usage: '[code]',
    examples: ['1', 'process.reallyExit()']
  },
  onBefore: (ctx: Context) => ctx.client.isOwner(ctx.userId),
  run: async (_assyst: Assyst, ctx: Context, args: any) => {
    let evaled: any;
    try {
    // eslint-disable-next-line no-eval
      evaled = await Promise.resolve(eval(args.eval));
    } catch (e) {
      return ctx.editOrReply(Markup.codeblock(e.message, { limit: 1990, language: 'js' }));
    }

    if (typeof evaled === 'object') {
      evaled = inspect(evaled, { depth: 0, showHidden: true });
    } else {
      evaled = String(evaled);
    }

    evaled = evaled.split(ctx.client.token).join(' ');

    return ctx.editOrReply(Markup.codeblock(evaled, { language: 'js', limit: 1990 }));
  }
};
