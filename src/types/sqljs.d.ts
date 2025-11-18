declare module "sql.js" {
  // Minimal declaration to satisfy TypeScript for the demo.
  export interface Database {
    run(sql: string, params?: unknown[]): void;
    prepare(sql: string): Statement;
    export(): Uint8Array;
  }

  export interface Statement {
    step(): boolean;
    get(): unknown[];
    free(): void;
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export const initSqlJs: (config: {
    locateFile?: (file: string) => string;
  }) => Promise<SqlJsStatic>;

  const defaultExport: typeof initSqlJs;

  export default defaultExport;
}
