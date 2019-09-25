import { Message } from 'discord.js';

import { botLog } from '../bot-log';

const logger = botLog();

/** utility class to store settings in comments on a discord channel */
export class DataMessage {
    public message: Message | undefined;
    private value: string | undefined;

    public get data(): string | undefined {
        return this.value;
    }

    public set data(x: string | undefined) {
        this.value = x;
        const content = `${this.key}${this.value}`;
        if (this.message) {
            // tslint:disable-next-line: no-floating-promises
            this.message.edit(content)
                .catch((error) => {
                    logger.error(`when editing a setting`, error);
                });
        } else {
            // tslint:disable-next-line: no-floating-promises
            this.createSettingsCallback(content)
                .then((message) => {
                    this.message = message instanceof Message ? message : message[0];
                })
                .catch((error) => {
                    logger.error('while creating a new setting for ', this.key, error);
                });
        }
    }
    public constructor(
        public readonly key: string,
        private readonly createSettingsCallback: (content: string) => Promise<Message | Message[]>) { }

    public trySetFrom(message: Message): boolean {
        if (message.content.startsWith(this.key)) {
            this.value = message.content.slice(this.key.length);
            this.message = message;

            return true;
        }

        return false;
    }
}
