import { TextChannel, Message, Guild } from 'discord.js';

import { ClientContext } from './client-context';
import { DataChannel } from './data-channel';

/**
 * A collection of requests posted by guildmembers
 */
export class GuildRequests extends DataChannel {
    /** the message header for the list Message */
    private static readonly REQUESTS_HEADER = 'Requested Aquisitions';

    public constructor(
        settingsChannel: TextChannel,
        private readonly client: ClientContext,
        // tslint:disable-next-line: no-any
        initErrorCallback: (error: any) => void) {
        super(
            settingsChannel,
            [
                GuildRequests.REQUESTS_HEADER,
            ],
            () => { this.onLoadDone() });
    }

    public async addRequest(messageID: string, message: string): Promise<void> {
        const link = `https://discordapp.com/channels/${this.guildID}/${this.channelID}/${messageID}`;
        console.log('link', link);
        const title = message.substring('!request acquisition'.length)
            .split('\r\n')[0];
        console.log('title', title);

        this.addToList(`[${title}](${link})`);
    }

    public getList(): string {
        const data = this.get(GuildRequests.REQUESTS_HEADER);
        if (data) {
            return data.substring(GuildRequests.REQUESTS_HEADER.length - 1);
        }

        return 'empty';
    }

    protected onLoadDone() {
        console.log('guild-requests>loadDone');

        const data = this.get(GuildRequests.REQUESTS_HEADER);
        console.log('load done > data', data);
        if (!data) {
            console.log('creating new request list message');
            this.set(GuildRequests.REQUESTS_HEADER, GuildRequests.REQUESTS_HEADER);
        }
        // if(data && data)
        // this.loadList()
        //     .then(() => this.isLoaded = true)
        //     .catch(initErrorCallback);
    }

    private addToList(link: string): void {
        let data = this.get(GuildRequests.REQUESTS_HEADER);
        if (data) {
            data = `${data}\r\n${link}`;
            this.set(GuildRequests.REQUESTS_HEADER, data);
        }
    }

    // private async loadList(): Promise<void> {

    // }

}
