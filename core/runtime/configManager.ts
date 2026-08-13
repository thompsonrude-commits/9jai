import fs from 'fs';
import path from 'path';

export interface RuntimeConfig {
  maxCpuPercent?: number;
  maxRamMb?: number;
  defaultModelTimeoutMs?: number;
  loggingLevel?: 'debug' | 'info' | 'warn' | 'error';
}

const DEFAULT_CONFIG: RuntimeConfig = {
  maxCpuPercent: 80,
  maxRamMb: 4096,
  defaultModelTimeoutMs: 30000,
  loggingLevel: 'info',
};

export class ConfigManager {
  private config: RuntimeConfig;

  constructor(configFile?: string) {
    this.config = {};
    if (configFile && fs.existsSync(configFile)) {
      const raw = fs.readFileSync(configFile, 'utf8');
      try {
        this.config = this.normalize(JSON.parse(raw) as RuntimeConfig);
      } catch {
        this.config = {};
      }
    }
  }

  private normalize(cfg: RuntimeConfig = {}): RuntimeConfig {
    return {
      ...DEFAULT_CONFIG,
      ...cfg,
      maxCpuPercent: cfg.maxCpuPercent ?? DEFAULT_CONFIG.maxCpuPercent,
      maxRamMb: cfg.maxRamMb ?? DEFAULT_CONFIG.maxRamMb,
      defaultModelTimeoutMs: cfg.defaultModelTimeoutMs ?? DEFAULT_CONFIG.defaultModelTimeoutMs,
      loggingLevel: cfg.loggingLevel ?? DEFAULT_CONFIG.loggingLevel,
    };
  }

  get(): RuntimeConfig {
    return { ...this.normalize(this.config) };
  }

  set(cfg: RuntimeConfig) {
    this.config = this.normalize(cfg);
  }

  persist(filePath: string) {
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(this.get(), null, 2), 'utf8');
  }
}
