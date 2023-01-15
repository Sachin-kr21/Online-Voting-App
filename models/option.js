'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Option extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Option.belongsTo(models.Question, {
        foreignKey: "questionId",
      });
    }
    static async createOption({name , questionId}) {
      try {
        // console.log("2222222222")
        return await this.create({
          name: name,
          questionId: questionId,
        });
      } catch (error) {
        console.log(error);
      }
    }
    static async getOptions(id) {
      try {
        const allOptions = await Option.findAll({
          where: {
            questionId:id,
          },
        });
        return allOptions;
      } catch (error) {
        console.log(error);
      }
    }
    static async deleteOption(id) {
      return await this.destroy({
        where: {
          id,
        },
        cascade: true,
      });
    }
  }
  Option.init({
    name: {
      type:DataTypes.STRING,
      allowNull: false,
    },
    questionId : DataTypes.INTEGER

  }, {
    sequelize,
    modelName: 'Option',
  });
  return Option;
};