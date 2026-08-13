import type { WidgetDefinition, WidgetFramework } from './types';

export class DefaultWidgetFramework implements WidgetFramework {
  private widgets = new Map<string, WidgetDefinition>();

  async register(widget: WidgetDefinition): Promise<void> {
    this.widgets.set(widget.id, widget);
  }

  render(widgetId: string): WidgetDefinition | undefined {
    return this.widgets.get(widgetId);
  }
}
