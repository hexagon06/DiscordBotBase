import { Message, TextChannel } from 'discord.js';

import { botLog } from '../bot-log';

import { DataMessage } from './data-message';

const logger = botLog();
/**
 * A channel on which messages are used to store data by key.
 */
export class DataChannel {
    /** can be used for tasks in derived classes */
    // protected loadDone: () => void;

    private readonly data: Map<string, DataMessage>;
    public get channelID(): string {
        return this.channel.id;
    }

    public get guildID(): string {
        return this.channel.guild.id;
    }

    public constructor(
        private readonly channel: TextChannel,
        keys: string[],
        private readonly loadDone: () => void) {
        // this.loadDone = loadDoneHandler ? loadDoneHandler : () => { /** default initializder */ };
        console.log('handler', loadDone);
        console.log('keys', keys);
        this.data = new Map<string, DataMessage>(
            keys.map((key) => [key, new DataMessage(key, (content) => this.createSetting(content))]));

        channel.fetchMessages()
            .then((messages) => {
                logger.info('loading data');
                messages.forEach((message) => {
                    this.data.forEach((value: DataMessage) => {
                        trySet(value, message);
                    });
                });
            })
            .then(() => {
                console.log('loading done', this.loadDone);
                this.loadDone();
            })
            .catch((error) => {
                logger.error('data channel constructor ', error);
            });
    }

    public get(key: string): string | undefined {
        const message = this.data.get(key);

        return message ? message.data : undefined;
    }

    public set(key: string, value: string): void {
        let message = this.data.get(key);
        if (!message) {
            message = new DataMessage(key, (content) => this.createSetting(content));
            this.data.set(key, message);
        }
        message.data = value;
    }

    private async createSetting(content: string) {
        return this.channel.send(content);
    }
}

function trySet(setting: DataMessage, message: Message): void {
    if (setting.trySetFrom(message)) {
        logger.info(`  ${setting.key}: ${setting.data}`);
    }
}
