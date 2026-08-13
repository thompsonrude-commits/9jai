export class KnowledgeStoreError extends Error {
  constructor(message?: string) {
    super(message ?? 'KnowledgeStoreError');
    this.name = 'KnowledgeStoreError';
  }
}

export class DocumentNotFound extends KnowledgeStoreError {
  constructor(message?: string) {
    super(message ?? 'Document not found');
    this.name = 'DocumentNotFound';
  }
}

export class DuplicateDocument extends KnowledgeStoreError {
  constructor(message?: string) {
    super(message ?? 'Duplicate document');
    this.name = 'DuplicateDocument';
  }
}

export class InvalidDocument extends KnowledgeStoreError {
  constructor(message?: string) {
    super(message ?? 'Invalid document');
    this.name = 'InvalidDocument';
  }
}

export class InvalidIndex extends KnowledgeStoreError {
  constructor(message?: string) {
    super(message ?? 'Invalid index');
    this.name = 'InvalidIndex';
  }
}

export class StorageUnavailable extends KnowledgeStoreError {
  constructor(message?: string) {
    super(message ?? 'Storage unavailable');
    this.name = 'StorageUnavailable';
  }
}

export class TransactionFailed extends KnowledgeStoreError {
  constructor(message?: string) {
    super(message ?? 'Transaction failed');
    this.name = 'TransactionFailed';
  }
}
