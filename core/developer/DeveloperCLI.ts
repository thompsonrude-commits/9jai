import { DeveloperPlatform } from './DeveloperPlatform';
import type { CLICommandDescriptor } from './types';

export class DeveloperCLI {
  constructor(private readonly platform: DeveloperPlatform) {}

  async run(argv: string[]): Promise<void> {
    const [commandName, ...args] = argv.slice(2);
    if (!commandName) {
      this.printHelp();
      return;
    }

    const command = this.platform.listCommands().find((cmd) => cmd.name === commandName);
    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      this.printHelp();
      return;
    }

    try {
      await command.handler(args);
    } catch (err: any) {
      console.error(`Command failed: ${err?.message ?? err}`);
    }
  }

  printHelp() {
    console.log('9JA Developer Platform CLI');
    console.log('Usage: 9ja <command> [args]');
    console.log('Available commands:');
    for (const command of this.platform.listCommands()) {
      console.log(`  ${command.name} - ${command.description}`);
    }
  }
}

export default DeveloperCLI;
