export interface PlatformConfig {
  inference: {
    maxConcurrentJobs: number;
    gpuEnabled: boolean;
    distributedMode: 'single-node' | 'cluster';
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export const defaultPlatformConfig: PlatformConfig = {
  inference: {
    maxConcurrentJobs: 4,
    gpuEnabled: false,
    distributedMode: 'single-node'
  },
  logging: {
    level: 'info'
  }
};
