export class MockQueryBuilder {
  private readonly resolvedValue: unknown;

  public constructor(resolvedValue: unknown) {
    this.resolvedValue = resolvedValue;
  }

  public as = () => {
    return this;
  };

  public from = () => {
    return this;
  };

  public groupBy = () => {
    return this;
  };

  public innerJoin = () => {
    return this;
  };

  public leftJoin = () => {
    return this;
  };

  public limit = async () => {
    await Promise.resolve();
    return this.resolvedValue;
  };

  public orderBy = () => {
    return this;
  };

  public select = () => {
    return this;
  };

  public where = () => {
    return this;
  };
}
