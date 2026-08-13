import type { TemplateDescriptor } from './types';

export class TemplateRegistry {
  private readonly templates = new Map<string, TemplateDescriptor>();

  register(template: TemplateDescriptor): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template with id ${template.id} is already registered`);
    }
    this.templates.set(template.id, template);
  }

  unregister(templateId: string): void {
    this.templates.delete(templateId);
  }

  get(templateId: string): TemplateDescriptor | undefined {
    return this.templates.get(templateId);
  }

  list(): TemplateDescriptor[] {
    return Array.from(this.templates.values());
  }

  listByCategory(category: TemplateDescriptor['category']): TemplateDescriptor[] {
    return this.list().filter((template) => template.category === category);
  }

  findByTag(tag: string): TemplateDescriptor[] {
    return this.list().filter((template) => template.tags?.includes(tag));
  }
}
