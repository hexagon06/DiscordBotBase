import { ClientContext } from '../discord/client-context';
import { botLog } from '../bot-log';

/** Command to be executed by the user */
export interface Command {
    execute(command: CommandMessage): Promise<void>;
}

/** Binds a command to a stirng literal and describes how the user can use the command */
export interface CommandBinding {
    hidden?: boolean; // Hidden from normal roles when using help
    instructions: string;
    root: string;
    factory(client: ClientContext): Command;
}

/** Input of a command, based on a discord message */
export interface CommandMessage {
    args: string[];
    channelID: string;
    cmd: string;
    guildID: string;
    message: string;
    messageID: string;
    user: string;
    userID: string;
}

/** puts the input in a scripting block for discord with the defined syntax */
export function syntaxBlock(input: string, syntax: string): string {
    // tslint:disable-next-line:prefer-template
    return '```' + syntax + '\r\n' + input + '\r\n```';
}

/** basic implementation of an command */
export abstract class BaseCommand implements Command {
    protected logger = botLog();
    public constructor(protected client: ClientContext) { }

    // tslint:disable-next-line: no-async-without-await
    public async abstract execute(command: CommandMessage): Promise<void>;
}
