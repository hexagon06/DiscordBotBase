import { TextChannel } from 'discord.js';

import { ClientContext } from './client-context';
import { DataChannel } from './data-channel';

/**
 * Stores all settings for a Guild/Server in a channel on that Guild/Server
 */
export class GuildSettings extends DataChannel {
    private static readonly requestsChannelKey = 'requests-channel';

    public get requestsChannel(): TextChannel | undefined {
        const data = this.get(GuildSettings.requestsChannelKey);
        if (data) {
            const channel = this.client.getChannel(data);
            if (channel instanceof TextChannel) {
                return channel;
            }
        }
    }

    public set requestsChannel(channel: TextChannel | undefined) {
        if (channel) {
            this.set(GuildSettings.requestsChannelKey, channel.id);
        }
    }

    public constructor(
        settingsChannel: TextChannel,
        private readonly client: ClientContext) {
        super(
            settingsChannel,
            [
                GuildSettings.requestsChannelKey,
            ],
            () => { /** nothing to do after loading settings */ });
    }
}
