import { Context } from 'detritus-client/lib/command';
import Zx8RestClient from '../../rest/clients/Zx8';
import Assyst from '../../structures/Assyst';
import { MetricItem } from '../../structures/Utils';

import { Markup } from 'detritus-client/lib/utils';

export default {
  name: 'zx8 host',
  aliases: ['zx8 h'],
  responseOptional: true,
  metadata: {
    description: 'Get a host from the zx8 search engine',
    usage: '<search param>',
    examples: ['hello', 'bruh']
  },
  ratelimit: {
    type: 'guild',
    limit: 1,
    duration: 5000
  },
  run: async (assyst: Assyst, ctx: Context, args: any) => {
    const client: Zx8RestClient | undefined = <Zx8RestClient | undefined>assyst.customRest.clients.get('zx8');
    if (!client) throw new Error('There is no zx8 client present in the rest controller');
    if (!args || !args['zx8 host']) {
      return ctx.editOrReply('You need to supply a search parameter');
    }
    const res = await client.getHost(args['zx8 host']);
    if (res === undefined) {
      return ctx.editOrReply('No host found for this query');
    }
    const rows: MetricItem[] = [];
    Object.entries(res).forEach(([key, value]) => {
      key = key[0].toUpperCase() + key.slice(1);
      if (key !== 'Headers' && key !== 'LastResponseTime') {
        rows.push({
          name: `${key}:`,
          value
        });
      }
    });
    return ctx.editOrReply({
      embed: {
        title: `zx8 Host: ${res.host}`,
        description: Markup.codeblock(assyst.utils.formatMetricList(rows, 20, [
          {
            item: 'LastRequest:',
            format: (item: string) => { return new Date(parseInt(item)).toLocaleString(); }
          }
        ]), { language: 'ml' }),
        color: 0x0fbcf9
      }
    });
  }
};
