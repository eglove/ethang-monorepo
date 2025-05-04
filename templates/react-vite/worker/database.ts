import { D1Orm, DataTypes, Model } from "d1-orm";

// eslint-disable-next-line sonar/no-reference-error
export const getDatabase = (environment: Env) => {
  return new D1Orm(environment.DB);
};

export const getTodos = (environment: Env) => {
  const database = getDatabase(environment);

  return new Model(
    {
      D1Orm: database,
      primaryKeys: "id",
      tableName: "Todo",
    },
    {
      due: {
        notNull: true,
        type: DataTypes.STRING,
      },
      id: {
        notNull: true,
        type: DataTypes.STRING,
      },
      name: {
        notNull: true,
        type: DataTypes.STRING,
      },
    },
  );
};
