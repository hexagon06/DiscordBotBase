export * from './discord';
export * from './command/command';
export * from './bot-log';
// it aparantly needs some class in this file to properly publish the package to npm.
// without this class the subdirectories are not unpacked, filecount does still seem correct on packing though...
export class RootBotTest { }
