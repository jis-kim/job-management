export class JobIdExistsError extends Error {
  constructor(id: string) {
    super(`Job with id ${id} already exists`);
    this.name = 'JobIdExistsError';
  }
}
