export class Audit {
  record(entry: any) {
    // lightweight: console log; replace with persistent audit store later
    // eslint-disable-next-line no-console
    console.log('AUDIT', JSON.stringify(entry));
  }
}
