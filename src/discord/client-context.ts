import {
    CategoryChannel, Channel,
    ChannelResolvable, Client,
    DMChannel, GroupDMChannel,
    Guild, Message, NewsChannel, TextChannel, VoiceChannel, GuildChannel,
} from 'discord.js';

import { botLog } from '../bot-log';
import { CommandMessage } from "../command/command";

import { GuildRequests } from './guild-requests';
import { GuildSettings } from './guild-settings';

/** proxy to discord.js API */
export class ClientContext {

    public get channels() {
        return this.client.channels;
    }

    public get guilds() {
        return this.client.guilds;
    }
    public isConnected = false;
    private readonly client: Client;
    private readonly logger = botLog();
    /** map between guildID and GuildRequests */
    private readonly requests = new Map<string, GuildRequests>();
    /** map between guildID and GuildSettings */
    private readonly settings = new Map<string, GuildSettings>();
    private readonly commandSplitRegex = new RegExp(' |\r|\n');

    public constructor(public commandCallback?: (message: CommandMessage) => void) {
        this.client = new Client();
        this.client.on('ready', () => this.readyHandler());
        this.client.on('disconnect', (message: string, code: number) => this.disconnectHandler(message, code));
        this.client.on('message', (command) => this.messageHandler(command));
    }

    public connect(token: string, doneHandler: (isConnected: boolean) => void): void {
        this.client.login(token)
            .then(() => doneHandler(true))
            .catch((error) => {
                this.logger.error('connection error: ', error);
                doneHandler(false);
            });
    }

    public async createChannel(
        serverID: string,
        type: 'text' | 'category',
        name: string,
        parentChannel?: ChannelResolvable): Promise<CategoryChannel | TextChannel | VoiceChannel> {

        // Type?: 'category' | 'text' | 'voice' | 'news' | 'store';
        // Name?: string;
        // Position?: number;
        // Topic?: string;
        // Nsfw?: boolean;
        // Bitrate?: number;
        // UserLimit?: number;
        // Parent?: ChannelResolvable;
        // PermissionOverwrites?: PermissionOverwrites[] | ChannelCreationOverwrites[];
        // RateLimitPerUser?: number;
        return this.getGuild(serverID)
            .createChannel(name, {
                type,
                parent: parentChannel,
            });
    }

    // tslint:disable-next-line: prefer-function-over-method
    public async getSome(input: string) {
        return new Promise<string>(() => {
            console.log('as promised');

            return {
                p: 'www',
            };
        });
    }

    public async createSome(guildID: string, name: string, managerRoleID: string) {
        return new Promise<{p: string}>(() => {
            console.log('as promised');

            return {
                p: 'www',
            };
        });
    }

    public async createChannelCategory(guildID: string, name: string, managerRoleID: string): Promise<CategoryChannel> {
        const guild = this.getGuild(guildID);

        return guild.createChannel(
            name,
            {
                type: 'category',
                permissionOverwrites: [
                    {
                        id: guild.defaultRole.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: managerRoleID,
                        allow: ['VIEW_CHANNEL'],
                    }],
            })
            .then((channel) => {
                if (channel instanceof CategoryChannel) {
                    return channel;
                }

                throw Error(`Invalid chaneltype! expected CategoryChannel but got ${channel.type}`);
            });
    }

    public getChannel(channelID: string): Channel {
        return this.client.channels.find((c) => c.id === channelID);
    }

    public getGuild(guildID: string): Guild {
        return this.client.guilds.find((g) => g.id === guildID);
    }

    public getMessage(channeldID: string, messageID: string): Message | undefined {
        const channel = this.getChannel(channeldID);
        if (channel instanceof TextChannel ||
            channel instanceof DMChannel ||
            channel instanceof GroupDMChannel ||
            channel instanceof NewsChannel) {
            return channel.messages.get(messageID);
        }
    }

    public getRequests(guildID: string): GuildRequests | undefined {
        return this.requests.get(guildID);
    }

    public getSettings(guildID: string): GuildSettings | undefined {
        return this.settings.get(guildID);
    }

    public async reply(channelID: string, messageID: string, content: string) {
        const message = this.getMessage(channelID, messageID);
        if (message) {
            return message.reply(content)
                .catch((error) => {
                    this.logger.error(`error when replying to ${messageID}`, error);
                });
        }
    }

    public setRequests(guildID: string, requests: GuildRequests): void {
        this.requests.set(guildID, requests);
    }

    public setSettings(guildID: string, settings: GuildSettings): void {
        this.settings.set(guildID, settings);
    }

    /**
     * Send text as a message to a channel
     * @param channelID The id of a channel. This must be a Text-, DM-, GroupDM- or NewsChannel
     * @param message the text of the message
     */
    // tslint:disable-next-line:member-ordering
    public async send(channelID: string, message: string): Promise<void | Message | Message[]> {
        const channel = this.getChannel(channelID);
        if (channel instanceof TextChannel ||
            channel instanceof DMChannel ||
            channel instanceof GroupDMChannel ||
            channel instanceof NewsChannel) {
            return channel.send(message)
                .catch((error) => {
                    // tslint:disable-next-line: no-unsafe-any
                    this.logger.error('while sending to channel', error);
                });
        }
        if (channel) {
            // Todo add a catcher for this stuff and log it to a discord channel
            throw new Error(`${channel.id} is not a TextChannel but a ${channel.type} channel`);
        }
        throw new Error(`no channel found with id ${channelID} when trying to send ${message}`);
    }

    /**
     * The library has either disconnected from Discord or
     * failed to log in after a .connect() call.
     * If it's the former, the code will be a WebSocket Error Code (1xxx - 4xxx).
     * If it's the latter, the code will be 0.
     */
    private disconnectHandler(errMsg: string, code: number) {
        // Todo maybe retry?
        if (code.toString() === '0') {
            this.logger.error('disconnection error', errMsg);
        } else {
            this.logger.error(errMsg, code);
        }
        this.isConnected = false;
    }

    /**
     * @param user : The user's name.
     * @param userID : The user's ID.
     * @param channelID : The ID of the room where the this.client received the message.
     * @param text : The chat message.
     */
    private messageHandler(message: Message) {
        const text = message.content;
        // Our this.client needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        try {
            if (text.substring(0, 1) === '!') {
                let args = text.substring(1)
                    .split(this.commandSplitRegex);
                const cmd = args[0];
                args = args.splice(1);

                if (this.commandCallback) {
                    const command = {
                        user: message.author.username,
                        userID: message.author.id,
                        channelID: message.channel.id,
                        message: text,
                        messageID: message.id,
                        args,
                        cmd,
                        guildID: message.guild.id,
                    };

                    this.commandCallback(command);
                }
            }
        } catch (e) {
            // tslint:disable-next-line: no-unsafe-any
            this.send(message.channel.id, `something went wrong!: ${e.message}`);
        }
    }

    private readyHandler() {
        this.logger.info('Connected');
        this.logger.info('Logged in as: ');
        this.logger.info(`${this.client.user.username} - (${this.client.user.id})`);
        this.isConnected = true;
    }
}
