import * as fs from 'fs/promises';
import * as path from 'path';
import type { ModelDescriptor, ModelValidationResult, ModelSecurityProvider } from './types';

const SUPPORTED_FILE_EXTENSIONS = ['.bin', '.pt', '.onnx', '.tflite', '.json'];

export class ModelValidator {
  constructor(private readonly securityProvider?: ModelSecurityProvider) {}

  async validate(model: ModelDescriptor): Promise<ModelValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!model.id) errors.push('Model id is missing');
    if (!model.name) errors.push('Model name is missing');
    if (!model.category) errors.push('Model category is missing');
    if (!model.provider) errors.push('Model provider is missing');
    if (!model.version) errors.push('Model version is missing');
    if (!model.filePath) errors.push('Model file path is missing');
    if (!model.supportedTasks || model.supportedTasks.length === 0) {
      errors.push('Model supported tasks are required');
    }

    if (model.filePath && !(await this.fileExists(model.filePath))) {
      errors.push(`Model file not found at ${model.filePath}`);
    }

    if (model.filePath && !SUPPORTED_FILE_EXTENSIONS.includes(path.extname(model.filePath))) {
      warnings.push(`Unknown or unsupported model file extension ${path.extname(model.filePath)}`);
    }

    if (model.checksum && this.securityProvider?.verifyChecksum) {
      const ok = await this.securityProvider.verifyChecksum(model.filePath, model.checksum);
      if (!ok) errors.push('Checksum validation failed');
    }

    if (model.signature && this.securityProvider?.verifySignature) {
      const ok = await this.securityProvider.verifySignature(model.signature);
      if (!ok) errors.push('Signature validation failed');
    }

    if (model.license && this.securityProvider?.validateLicense) {
      const ok = await this.securityProvider.validateLicense(model.license);
      if (!ok) errors.push('License validation failed');
    }

    if (model.source && this.securityProvider?.isTrustedSource) {
      const trusted = await this.securityProvider.isTrustedSource(model.source);
      if (!trusted) warnings.push(`Model source ${model.source} is not explicitly trusted`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
